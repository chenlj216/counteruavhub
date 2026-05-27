#!/usr/bin/env python3
"""
Server-side CounterUAVHub blog draft runner.

This script writes validated Markdown drafts and prints a review summary for
manual inspection.
"""

from __future__ import annotations

import argparse
import json
import re
import shlex
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_PROJECT_ROOT = Path("/root/.openclaw/workspace/projects/counteruavhub")
DEFAULT_STATUS_DIR = Path("var/blog-automation")
OPENCLAW_AGENT = "main"
OPENCLAW_SESSION_PREFIX = "counteruavhub_blog"


class RunnerError(RuntimeError):
    pass


def run_command(command: list[str], cwd: Path, timeout: int = 120, check: bool = True) -> subprocess.CompletedProcess:
    result = subprocess.run(command, cwd=cwd, text=True, capture_output=True, timeout=timeout)
    if check and result.returncode != 0:
        raise RunnerError(
            f"Command failed ({result.returncode}): {' '.join(command)}\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
        )
    return result


def run_node(command: str, web_root: Path, timeout: int = 120, check: bool = True) -> subprocess.CompletedProcess:
    shell = f"export NVM_DIR=/root/.nvm; source \"$NVM_DIR/nvm.sh\" 2>/dev/null || true; {command}"
    return run_command(["bash", "-lc", shell], cwd=web_root, timeout=timeout, check=check)


def status_directory(project_root: Path, configured: Path | None = None) -> Path:
    if configured is None:
        return project_root / DEFAULT_STATUS_DIR
    return configured if configured.is_absolute() else project_root / configured


def write_status(project_root: Path, payload: dict, configured_dir: Path | None = None) -> Path:
    status_dir = status_directory(project_root, configured_dir)
    status_dir.mkdir(parents=True, exist_ok=True)

    status = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "projectRoot": str(project_root),
        **payload,
    }

    status_path = status_dir / "status.json"
    tmp_path = status_dir / ".status.json.tmp"
    tmp_path.write_text(json.dumps(status, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp_path.replace(status_path)

    history_path = status_dir / "history.jsonl"
    with history_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(status, ensure_ascii=False) + "\n")

    return status_path


def load_context(project_root: Path) -> dict:
    web_root = project_root / "web"
    result = run_node("node scripts/blog-context-builder.mjs --json", web_root)
    return json.loads(result.stdout)


def build_agent_prompt(context: dict) -> str:
    return f"""
You are writing for CounterUAVHub, an English-language counter-UAS technical resource site.

Use the context JSON below to select exactly one high-value technical article topic and produce a safe Markdown blog draft.

Hard requirements:
- Output a single fenced JSON block and no prose outside it.
- JSON keys: slug, title, date, excerpt, keywords, body, review.
- date must be YYYY-MM-DD.
- body must be Markdown without frontmatter.
- Write defensive, educational, public-source, system-planning content only.
- Do not include operational jamming instructions, spoofing steps, evasion advice, bypass methods, or attack procedures.
- Include at least two internal links. At least one must link to a /tools/ page.
- Prefer system engineering, RF source confidence, sensor fusion, compliance, and deployment trade-off framing.
- If a technical point is uncertain, label it as a public-source estimate or operational caveat.

Context JSON:
```json
{json.dumps(context, ensure_ascii=False, indent=2)}
```
""".strip()


def extract_openclaw_text(payload: object) -> str:
    if isinstance(payload, str):
        return payload

    if isinstance(payload, list):
        parts = [extract_openclaw_text(item) for item in payload]
        return "\n".join(part for part in parts if part.strip())

    if isinstance(payload, dict):
        preferred_keys = (
            "content",
            "response",
            "output",
            "message",
            "text",
            "result",
            "data",
            "assistant",
        )
        for key in preferred_keys:
            if key in payload:
                text = extract_openclaw_text(payload[key])
                if text.strip():
                    return text

        parts = [extract_openclaw_text(value) for value in payload.values()]
        return "\n".join(part for part in parts if part.strip())

    return ""


def dispatch_openclaw_task(project_root: Path, context: dict, timeout: int) -> tuple[dict, str]:
    session_id = f"{OPENCLAW_SESSION_PREFIX}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    prompt = build_agent_prompt(context)

    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=project_root, prefix=".blog-agent-prompt-", suffix=".txt", delete=False) as handle:
        handle.write(prompt)
        prompt_path = Path(handle.name)

    try:
        shell = " ".join(
            [
                'export NVM_DIR="/root/.nvm";',
                'source "$NVM_DIR/nvm.sh" 2>/dev/null || true;',
                "openclaw",
                "agent",
                "--agent",
                shlex.quote(OPENCLAW_AGENT),
                "--session-id",
                shlex.quote(session_id),
                "--message",
                f'"$(cat {shlex.quote(str(prompt_path))})"',
                "--json",
            ]
        )
        result = run_command(["bash", "-lc", shell], cwd=project_root, timeout=timeout, check=False)
    finally:
        prompt_path.unlink(missing_ok=True)

    payload = {
        "agent": OPENCLAW_AGENT,
        "sessionId": session_id,
        "returncode": result.returncode,
        "stdout": result.stdout,
        "stderr": result.stderr,
    }

    if result.returncode != 0:
        raise RunnerError(
            f"OpenClaw agent failed ({result.returncode}) for agent={OPENCLAW_AGENT} session={session_id}.\n"
            f"STDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
        )

    output_text = result.stdout.strip()
    if output_text:
        try:
            parsed = json.loads(output_text)
        except json.JSONDecodeError:
            parsed = None
        if parsed is not None:
            extracted = extract_openclaw_text(parsed).strip()
            if extracted:
                output_text = extracted

    if not output_text:
        raise RunnerError(f"OpenClaw agent returned empty output for agent={OPENCLAW_AGENT} session={session_id}.")

    return payload, output_text


def summarize_error(text: str, limit: int = 1200) -> str:
    cleaned = re.sub(r"https://api\.telegram\.org/bot[^\s]+", "https://api.telegram.org/bot[REDACTED]", text)
    cleaned = re.sub(r"sk-[A-Za-z0-9_-]+", "sk-REDACTED", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:limit] if cleaned else "(no details)"


def extract_json_block(text: str) -> dict:
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        return json.loads(fenced.group(1))

    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        return json.loads(text[start : end + 1])

    raise RunnerError("Could not find a JSON draft object in OpenClaw agent output.")


def frontmatter_value(value: object) -> str:
    text = str(value or "").replace('"', '\\"').strip()
    return f'"{text}"'


def build_markdown(draft: dict) -> str:
    keywords = draft.get("keywords", "")
    if isinstance(keywords, list):
        keywords = ", ".join(str(item) for item in keywords)

    body = str(draft.get("body", "")).strip()
    if not body:
        raise RunnerError("OpenClaw draft JSON did not include a body.")

    return "\n".join(
        [
            "---",
            f"title: {frontmatter_value(draft.get('title'))}",
            f"date: {frontmatter_value(draft.get('date') or datetime.now(timezone.utc).date().isoformat())}",
            f"excerpt: {frontmatter_value(draft.get('excerpt'))}",
            f"keywords: {frontmatter_value(keywords)}",
            "---",
            "",
            body,
            "",
        ]
    )


def write_draft(project_root: Path, draft: dict, markdown: str) -> Path:
    slug = str(draft.get("slug", "")).strip()
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        raise RunnerError(f"Invalid draft slug: {slug}")

    blog_dir = project_root / "web" / "content" / "blog"
    draft_path = blog_dir / f"{slug}.md"
    if draft_path.exists():
        raise RunnerError(f"Draft path already exists: {draft_path}")

    draft_path.write_text(markdown, encoding="utf-8")
    return draft_path


def validate_draft(project_root: Path, draft_path: Path) -> dict:
    web_root = project_root / "web"
    relative = draft_path.relative_to(web_root)
    result = run_node(f"node scripts/blog-draft-validator.mjs {relative}", web_root, check=False)
    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RunnerError(f"Validator did not return JSON.\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}") from exc

    if result.returncode != 0 or not payload.get("valid"):
        raise RunnerError(f"Draft validation failed:\n{json.dumps(payload, indent=2, ensure_ascii=False)}")

    return payload


def run_build_checks(project_root: Path, timeout: int) -> None:
    web_root = project_root / "web"
    run_node("npm run lint", web_root, timeout=timeout)
    run_node("npm run build", web_root, timeout=timeout)


def send_failure_notification(error: Exception) -> None:
    print(
        "\n".join(
            [
                "CounterUAVHub Blog Automation Failed",
                "",
                "Stage: OpenClaw Beidou draft generation or validation",
                f"Reason: {summarize_error(str(error))}",
                "",
                "Next action: check OpenClaw main/Beidou model credentials on the cloud server, then rerun counteruavhub-blog-review.service.",
            ]
        ),
        file=sys.stderr,
    )


def notification_text(draft: dict, draft_path: Path, validation: dict, build_checked: bool) -> str:
    review = draft.get("review") or {}
    risk = review.get("risk") if isinstance(review, dict) else None
    reason = review.get("reason") if isinstance(review, dict) else None
    excerpt = str(draft.get("excerpt") or "").strip()
    body_preview = re.sub(r"\s+", " ", str(draft.get("body") or "").strip())[:900]

    return "\n".join(
        [
            "CounterUAVHub Blog Draft Ready",
            "",
            f"Title: {draft.get('title', '(untitled)')}",
            f"Excerpt: {excerpt or '(missing)'}",
            f"Risk: {risk or 'Human review required'}",
            f"Reason: {reason or 'Generated from recent news, site gaps, and existing blog context.'}",
            "",
            "Checks:",
            "- Frontmatter valid",
            "- Slug not duplicated",
            f"- Word count: {validation.get('wordCount')}",
            f"- Internal links: {', '.join(validation.get('internalLinks', []))}",
            f"- Build checked: {'yes' if build_checked else 'skipped'}",
            "",
            "Preview:",
            body_preview or "(empty)",
            "",
            f"Review path: {draft_path}",
            "Next action: review the Markdown draft, then approve, revise, or reject before publishing.",
        ]
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-root", type=Path, default=DEFAULT_PROJECT_ROOT)
    parser.add_argument("--status-dir", type=Path, default=DEFAULT_STATUS_DIR)
    parser.add_argument("--timeout", type=int, default=900)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--skip-agent", action="store_true")
    parser.add_argument("--skip-hermes", action="store_true", dest="skip_agent", help=argparse.SUPPRESS)
    parser.add_argument("--skip-build", action="store_true")
    args = parser.parse_args()

    project_root = args.project_root.resolve()
    web_root = project_root / "web"
    status_dir = status_directory(project_root, args.status_dir)

    try:
        if not web_root.exists():
            raise RunnerError(f"Project web directory not found: {web_root}")

        write_status(
            project_root,
            {
                "status": "running",
                "stage": "context",
                "statusFile": str(status_dir / "status.json"),
            },
            args.status_dir,
        )

        context = load_context(project_root)
        candidates = context.get("candidates", [])
        print(f"Loaded blog context: {len(candidates)} candidate(s)")
        for candidate in candidates[:5]:
            print(f"- {candidate['title']} ({candidate['slug']})")

        if args.dry_run or args.skip_agent:
            status_path = write_status(
                project_root,
                {
                    "status": "dry_run",
                    "stage": "context",
                    "candidateCount": len(candidates),
                    "candidates": candidates[:5],
                    "agentSkipped": True,
                    "buildChecked": False,
                },
                args.status_dir,
            )
            print("Dry run or --skip-agent selected; no OpenClaw agent task, draft write, or build performed.")
            print(f"Status file: {status_path}")
            return 0

        write_status(
            project_root,
            {
                "status": "running",
                "stage": "agent",
                "candidateCount": len(candidates),
                "candidates": candidates[:5],
                "agent": OPENCLAW_AGENT,
            },
            args.status_dir,
        )
        payload, agent_output = dispatch_openclaw_task(project_root, context, timeout=args.timeout)
        print(f"OpenClaw agent completed agent={payload.get('agent')} session={payload.get('sessionId')}")

        write_status(
            project_root,
            {
                "status": "running",
                "stage": "draft_write",
                "candidateCount": len(candidates),
                "agent": payload.get("agent"),
                "sessionId": payload.get("sessionId"),
            },
            args.status_dir,
        )
        draft = extract_json_block(agent_output)
        markdown = build_markdown(draft)
        draft_path = write_draft(project_root, draft, markdown)

        validation = validate_draft(project_root, draft_path)
        build_checked = False
        if not args.skip_build:
            write_status(
                project_root,
                {
                    "status": "running",
                    "stage": "build",
                    "draftPath": str(draft_path),
                    "slug": draft.get("slug"),
                    "title": draft.get("title"),
                    "validation": validation,
                    "buildChecked": False,
                },
                args.status_dir,
            )
            run_build_checks(project_root, timeout=args.timeout)
            build_checked = True

        status_path = write_status(
            project_root,
            {
                "status": "success",
                "stage": "complete",
                "draftPath": str(draft_path),
                "slug": draft.get("slug"),
                "title": draft.get("title"),
                "excerpt": draft.get("excerpt"),
                "review": draft.get("review") or {},
                "validation": validation,
                "buildChecked": build_checked,
                "agent": payload.get("agent"),
                "sessionId": payload.get("sessionId"),
            },
            args.status_dir,
        )

        message = notification_text(draft, draft_path, validation, build_checked)
        print(message)
        print(f"Status file: {status_path}")

        return 0
    except RunnerError as exc:
        try:
            status_path = write_status(
                project_root,
                {
                    "status": "failed",
                    "stage": "error",
                    "error": summarize_error(str(exc)),
                },
                args.status_dir,
            )
            print(f"Status file: {status_path}", file=sys.stderr)
        except Exception as status_error:
            print(f"WARNING: Failed to write status file: {status_error}", file=sys.stderr)
        send_failure_notification(exc)
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
