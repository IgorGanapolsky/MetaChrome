# 🚀 Quick Start: BrowserStack App Live

Get your Expo app running on BrowserStack in 5 minutes!

## Step 1: Get BrowserStack Credentials

1. Sign up at [browserstack.com](https://www.browserstack.com) (free trial available)
2. Go to [Account Settings](https://www.browserstack.com/accounts/settings)
3. Copy your **Username** and **Access Key**

## Step 2: Configure Environment

```bash
cd frontend

# Create .env file
cp .env.example .env

# Edit .env and add your credentials
# BROWSERSTACK_USERNAME=your_username
# BROWSERSTACK_ACCESS_KEY=your_access_key
```

## Step 3: Build Your App

### Option A: Android APK (Easiest)
```bash
# Install EAS CLI if needed
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

### Option B: Use Expo Development Build
```bash
# For quick testing, you can use Expo Go or development build
expo start
```

## Step 4: Upload to BrowserStack

```bash
# Upload your APK
yarn browserstack:upload path/to/your-app.apk

# Copy the App ID (starts with bs://)
# Add it to .env:
# BROWSERSTACK_APP_ID=bs://abc123def456...
```

## Step 5: Launch App Live

```bash
# Start on iPhone 14 Pro
yarn browserstack:live:ios

# Or Android device
yarn browserstack:live:android

# Or default device
yarn browserstack:live
```

## Step 6: Open in Browser

The script will output a URL. Open it in your browser to:
- ✅ See your app running on a real device
- ✅ Interact with it using mouse/touch
- ✅ Test on different devices
- ✅ Debug in real-time

## Alternative: Web Version (No BrowserStack Needed)

If you just want to see the web version locally:

```bash
yarn web
# Opens at http://localhost:8081
```

## Troubleshooting

**"App ID not found"**
→ Upload your app first: `yarn browserstack:upload`

**"Authentication failed"**
→ Check your `.env` file has correct credentials

**"App file not found"**
→ Build your app first or provide full path

## Need Help?

See `README_BROWSERSTACK.md` for detailed documentation.
