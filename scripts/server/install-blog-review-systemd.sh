#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${PROJECT_ROOT:-/root/.openclaw/workspace/projects/counteruavhub}"
UNIT_DIR="${UNIT_DIR:-/etc/systemd/system}"

if [[ "$(id -u)" != "0" ]]; then
  echo "This installer must run as root." >&2
  exit 1
fi

install -m 644 "$PROJECT_ROOT/scripts/server/systemd/counteruavhub-blog-review.service" "$UNIT_DIR/counteruavhub-blog-review.service"
install -m 644 "$PROJECT_ROOT/scripts/server/systemd/counteruavhub-blog-review.timer" "$UNIT_DIR/counteruavhub-blog-review.timer"

systemctl daemon-reload
systemctl enable counteruavhub-blog-review.timer

echo "Installed counteruavhub-blog-review.service and timer."
echo "Start timer: systemctl start counteruavhub-blog-review.timer"
echo "Manual run: systemctl start counteruavhub-blog-review.service"
