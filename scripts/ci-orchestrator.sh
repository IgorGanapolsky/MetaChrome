#!/usr/bin/env bash
set -euo pipefail

# Orchestrate CI, LangSmith sync, and RAG ingest in parallel and post status.
# Requirements: gh CLI authenticated (GITHUB_TOKEN), optional SLACK_WEBHOOK_URL.

WORKFLOWS=("CI" "LangSmith Sync" "RAG Ingest (MetaChrome)")
REF="main"

trigger_workflow() {
  local wf="$1"
  gh workflow run "$wf" --ref "$REF" >/dev/null
  # allow GitHub to register the run
  sleep 2
  gh run list --workflow "$wf" --branch "$REF" --limit 1 \
    --json databaseId,url,status,conclusion,displayTitle,createdAt \
    --jq '.[0]'
}

runs=()
for wf in "${WORKFLOWS[@]}"; do
  if out=$(trigger_workflow "$wf"); then
    runs+=("$out")
  fi
done

# Print summary
printf "Triggered workflows on %s:\n" "$REF"
for run in "${runs[@]}"; do
  id=$(jq -r '.databaseId' <<<"$run")
  url=$(jq -r '.url' <<<"$run")
  title=$(jq -r '.displayTitle' <<<"$run")
  status=$(jq -r '.status' <<<"$run")
  echo "- $title [$status] $url (run id: $id)"
done

# Optional Slack notification
if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
  payload=$(jq -n --arg text "Triggered CI/LangSmith/RAG on $REF" \
    --arg runs "$(printf '%s\n' "${runs[@]}")" \
    '{text:$text, blocks:[{type:"section",text:{type:"mrkdwn",text:$text}}, {type:"section",text:{type:"mrkdwn",text:$runs}}]}')
  curl -X POST -H 'Content-Type: application/json' --data "$payload" "$SLACK_WEBHOOK_URL" >/dev/null || true
fi
