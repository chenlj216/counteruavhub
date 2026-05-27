# Blog Automation Telegram Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a server-side CounterUAVHub blog draft workflow that asks Hermes `default` profile to generate technical article drafts, validates them, writes a machine-readable status file, and prints a review summary without auto-publishing to `main`.

**Architecture:** Project-local Node scripts build deterministic topic context and validate Markdown drafts. A server runner in `scripts/server/` orchestrates Hermes `default` profile invocation, draft extraction, validation, optional build checks, `var/blog-automation/status.json`, `var/blog-automation/history.jsonl`, and stdout/journal review summary. Hermes/OpenClaw core service files remain unchanged.

**Tech Stack:** Node.js ESM, `node:test`, `gray-matter`, Python 3.11, Hermes CLI, existing Next.js build.

---

### Task 1: Blog Context And Validator

**Files:**
- Create: `web/scripts/blog-context-builder.mjs`
- Create: `web/scripts/blog-draft-validator.mjs`
- Create: `web/scripts/blog-automation.test.mjs`
- Modify: `web/package.json`

- [ ] **Step 1: Write failing tests**

Add tests that import missing context/validator modules, build candidates from fixture news/posts, reject unsafe draft text, and accept a safe draft with internal links.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && node --test scripts/blog-automation.test.mjs`
Expected: FAIL because `blog-context-builder.mjs` and `blog-draft-validator.mjs` do not exist yet.

- [ ] **Step 3: Implement minimal modules**

Implement deterministic candidate generation, Markdown frontmatter parsing, banned-pattern detection, duplicate slug checks, and CLI entrypoints.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && node --test scripts/blog-automation.test.mjs`
Expected: PASS.

### Task 2: Server Runner

**Files:**
- Create: `scripts/server/blog-draft-review-runner.py`
- Create: `docs/blog-automation.md`

- [ ] **Step 1: Implement runner**

The runner should support `--dry-run`, `--skip-agent`, `--skip-build`, `--timeout`, `--status-dir`, `--hermes-bin`, and `--hermes-profile`. Telegram notification is out of scope for the current version.

- [ ] **Step 2: Verify syntax and dry-run**

Run: `python3 -m py_compile scripts/server/blog-draft-review-runner.py`
Run on server: `python3 scripts/server/blog-draft-review-runner.py --dry-run --skip-agent --skip-build`
Expected: prints context summary and exits without writing a draft.

### Task 3: Integration Verification

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: Run local tests**

Run: `cd web && npm run test:blog-automation`
Expected: PASS.

- [ ] **Step 2: Run site validation**

Run: `cd web && npm run lint`
Run: `cd web && npm run build`
Expected: both pass.

- [ ] **Step 3: Sync to server and dry-run there**

Copy changed files to `/root/.openclaw/workspace/projects/counteruavhub`, then run the dry-run command with NVM-loaded Node.
