#!/bin/bash
# Run Maestro smoke tests

set -e

echo "🧪 Running Maestro Smoke Tests"
echo ""

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
  echo "📥 Installing Maestro..."
  curl -Ls "https://get.maestro.mobile.dev" | bash
  export PATH="$PATH:$HOME/.maestro/bin"
fi

# Check if device is connected
echo "📱 Checking for connected devices..."
if command -v adb &> /dev/null; then
  DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l)
  if [ "$DEVICES" -eq 0 ]; then
    echo "⚠️  No Android devices found. Please connect a device or start an emulator."
    echo "   Start emulator: emulator -avd <avd_name>"
    exit 1
  fi
  echo "✅ Found $DEVICES Android device(s)"
fi

# Check iOS simulator (if on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
  SIMULATORS=$(xcrun simctl list devices | grep "Booted" | wc -l)
  if [ "$SIMULATORS" -gt 0 ]; then
    echo "✅ Found iOS simulator(s)"
  fi
fi

echo ""
echo "🚀 Running Maestro flows..."

# Run each flow
for flow in maestro/flows/*.yaml; do
  if [ -f "$flow" ]; then
    echo ""
    echo "📋 Running: $(basename $flow)"
    maestro test "$flow" || {
      echo "❌ Flow failed: $(basename $flow)"
      exit 1
    }
  fi
done

echo ""
echo "✅ All smoke tests passed!"
