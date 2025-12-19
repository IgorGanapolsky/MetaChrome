#!/usr/bin/env bash
# Usage: ./scripts/thumbs.sh up "reason" [--sync] or down "reason" [--sync]
set -euo pipefail
if [ $# -lt 2 ]; then
  echo "Usage: $0 up|down "message" [--sync]" >&2
  exit 1
fi
SIGN=$1; shift
MSG=$1; shift
if [ "$SIGN" = "up" ]; then
  PREFIX="thumbs up"
elif [ "$SIGN" = "down" ]; then
  PREFIX="thumbs down"
else
  echo "First arg must be up or down" >&2
  exit 1
fi
NODE=$(command -v node || true)
if [ -z "$NODE" ]; then
  echo "node not found" >&2
  exit 1
fi
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$REPO_ROOT"
$NODE ./scripts/add-lesson.js "$PREFIX: $MSG" "$@"
