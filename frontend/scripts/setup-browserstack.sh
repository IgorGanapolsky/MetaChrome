#!/bin/bash

echo "🚀 BrowserStack Setup"
echo "===================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
  echo "✅ Created .env file"
  echo ""
fi

# Check if credentials are set
if grep -q "your_username" .env || grep -q "your_access_key" .env; then
  echo "⚠️  Please update .env with your BrowserStack credentials:"
  echo "   1. Get credentials from: https://www.browserstack.com/accounts/settings"
  echo "   2. Edit .env file:"
  echo "      BROWSERSTACK_USERNAME=your_username"
  echo "      BROWSERSTACK_ACCESS_KEY=your_access_key"
  echo ""
else
  echo "✅ BrowserStack credentials found in .env"
fi

# Check if form-data is installed
if ! grep -q "form-data" package.json; then
  echo "📦 Installing form-data..."
  yarn add -D form-data
fi

echo ""
echo "📚 Next steps:"
echo "   1. Build your app: eas build --platform android"
echo "   2. Upload app: yarn browserstack:upload path/to/app.apk"
echo "   3. Add App ID to .env: BROWSERSTACK_APP_ID=bs://..."
echo "   4. Launch: yarn browserstack:live"
echo ""
echo "📖 See README_BROWSERSTACK.md for detailed instructions"
