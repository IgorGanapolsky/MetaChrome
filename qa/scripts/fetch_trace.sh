#!/usr/bin/env bash
set -e

# Usage: ./fetch_trace.sh <TRACE_ID> <OUTPUT_FILENAME>
# Example: ./fetch_trace.sh 8f3b2... regression_case_login_timeout.json

TRACE_ID=$1
OUTPUT=${2:-"trace_${TRACE_ID}.json"}

if [ -z "$TRACE_ID" ]; then
  echo "Usage: $0 <TRACE_ID> [OUTPUT_FILENAME]"
  exit 1
fi

# Ensure we are in the root or qa dir
cd "$(dirname "$0")/../.."

# Ensure output directory exists
mkdir -p qa/tests/data


# Load API Key from frontend/.env if applicable
if [ -f "frontend/.env" ]; then
    export $(grep -v '^#' frontend/.env | xargs)
fi

# Ensure LANGCHAIN_API_KEY is set (map from LANGSMITH_API_KEY if needed)
if [ -z "$LANGCHAIN_API_KEY" ] && [ -n "$LANGSMITH_API_KEY" ]; then
    export LANGCHAIN_API_KEY=$LANGSMITH_API_KEY
fi

# Activate venv
source qa/.venv/bin/activate

# Execute Fetch
echo "Fetching trace $TRACE_ID from LangSmith..."
# Note: 'langsmith get-run' or similar commands depending on CLI version
# Based on blog, it might be 'langsmith fetch' if using the specific CLI tool
# If 'langsmith' CLI is not available, we use python script fallback.

if command -v langsmith &> /dev/null; then
  langsmith get-run "$TRACE_ID" > "qa/tests/data/$OUTPUT"
else
  # Fallback to python one-liner if CLI is tricky 
  python3 -c "from langsmith import Client; import json; c=Client(); run=c.read_run('$TRACE_ID'); print(json.dumps(run.json(), indent=2))" > "qa/tests/data/$OUTPUT"
fi

echo "Saved trace to qa/tests/data/$OUTPUT"
