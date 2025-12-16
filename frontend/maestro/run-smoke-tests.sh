#!/bin/bash
# Run Maestro smoke tests
# Usage: ./run-smoke-tests.sh [android|ios]

set -e

PLATFORM=${1:-android}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🧪 Running MetaChrome Smoke Tests on $PLATFORM"
echo "================================================"

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo "❌ Maestro is not installed. Install with: curl -Ls https://get.maestro.mobile.dev | bash"
    exit 1
fi

# Run smoke tests
echo ""
echo "📱 Running smoke tests..."
echo ""

FAILED=0

for test_file in "$SCRIPT_DIR"/smoke-*.yaml; do
    test_name=$(basename "$test_file" .yaml)
    echo "▶️  Running: $test_name"
    
    if maestro test "$test_file" --platform "$PLATFORM"; then
        echo "✅ $test_name passed"
    else
        echo "❌ $test_name failed"
        FAILED=$((FAILED + 1))
    fi
    echo ""
done

echo "================================================"
if [ $FAILED -eq 0 ]; then
    echo "✅ All smoke tests passed!"
    exit 0
else
    echo "❌ $FAILED smoke test(s) failed"
    exit 1
fi
