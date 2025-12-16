#!/bin/bash
# UAT Testing Script

set -e

echo "🧪 Running User Acceptance Tests"

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
  echo "📥 Installing Maestro..."
  curl -Ls "https://get.maestro.mobile.dev" | bash
  export PATH="$PATH:$HOME/.maestro/bin"
fi

echo ""
echo "📱 Running E2E Tests..."

# Run Maestro tests
maestro test maestro/flows/browser-basic.yaml
maestro test maestro/flows/add-tab.yaml
maestro test maestro/flows/meta-rayban.yaml

echo ""
echo "✅ E2E Tests Complete!"
echo ""
echo "📋 Next: Run manual UAT using UAT_CHECKLIST.md"
