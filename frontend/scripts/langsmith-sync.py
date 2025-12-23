#!/usr/bin/env python3
"""
Sync the latest LangSmith runs into frontend/artifacts/langsmith/latest.json.

Environment:
  LANGSMITH_API_KEY (required)
  LANGSMITH_PROJECT (default: MetaChrome)

Behavior:
  - Ensures langsmith Python client is available (installs on the fly if missing).
  - Fetches recent runs (default 50) for the project.
  - Writes JSON to artifacts/langsmith/latest.json.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

PROJECT = os.environ.get("LANGSMITH_PROJECT", "MetaChrome")
API_KEY = os.environ.get("LANGSMITH_API_KEY")
RUN_LIMIT = int(os.environ.get("LANGSMITH_RUN_LIMIT", "50"))
FAIL_IF_EMPTY = os.environ.get("LANGSMITH_FAIL_IF_EMPTY", "").lower() in {"1", "true", "yes"}
OUT_DIR = Path(__file__).resolve().parent.parent / "artifacts" / "langsmith"
OUT_FILE = OUT_DIR / "latest.json"


def ensure_langsmith():
    try:
        import langsmith  # type: ignore
        return langsmith
    except ImportError:
        print("langsmith not installed; installing...", file=sys.stderr)
        # Use a modern version that supports runs list.
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "--quiet", "langsmith>=0.1.126"]
        )
        import langsmith  # type: ignore
        return langsmith


def fetch_runs(langsmith):
    from langsmith import Client
    from requests import HTTPError

    client = Client(api_key=API_KEY)
    runs = []
    try:
        for run in client.list_runs(project_name=PROJECT, limit=RUN_LIMIT):
            runs.append(run)
    except Exception as e:
        # Log and surface a clear exit for CI
        print(f"LangSmith list_runs failed: {e}", file=sys.stderr)
        raise
    return runs


def main():
    if not API_KEY:
        print("Missing LANGSMITH_API_KEY", file=sys.stderr)
        sys.exit(1)

    langsmith = ensure_langsmith()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    runs = fetch_runs(langsmith)
    payload = {"project": PROJECT, "count": len(runs), "runs": [r.model_dump() for r in runs]}
    OUT_FILE.write_text(json.dumps(payload, indent=2, default=str))
    print(f"Saved {len(runs)} runs to {OUT_FILE}")
    if FAIL_IF_EMPTY and len(runs) == 0:
        print("No runs found and LANGSMITH_FAIL_IF_EMPTY=true; failing.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
