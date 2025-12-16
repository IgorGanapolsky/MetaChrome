#!/bin/bash
# Production build script for MetaChrome

set -e

echo "🚀 Building MetaChrome for Production"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
  echo "❌ EAS CLI not found. Install with: npm install -g eas-cli"
  exit 1
fi

# Check environment variables
if [ -z "$EAS_PROJECT_ID" ]; then
  echo "⚠️  EAS_PROJECT_ID not set. Run: eas init"
fi

# Build for iOS
echo ""
echo "📱 Building iOS..."
eas build --platform ios --profile production --non-interactive

# Build for Android
echo ""
echo "🤖 Building Android..."
eas build --platform android --profile production --non-interactive

echo ""
echo "✅ Builds complete!"
echo "📦 Check EAS dashboard for build status"
