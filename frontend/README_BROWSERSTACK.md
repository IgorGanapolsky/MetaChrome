# BrowserStack Setup Guide

This guide will help you run your Expo app on BrowserStack App Live, allowing you to interact with your app through a web browser on real devices.

## Prerequisites

1. **BrowserStack Account**: Sign up at [browserstack.com](https://www.browserstack.com)
2. **App Build**: You need a built app (APK for Android or IPA for iOS)

## Quick Start

### 1. Get BrowserStack Credentials

1. Go to [BrowserStack Account Settings](https://www.browserstack.com/accounts/settings)
2. Copy your **Username** and **Access Key**

### 2. Set Up Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
BROWSERSTACK_USERNAME=your_username
BROWSERSTACK_ACCESS_KEY=your_access_key
```

### 3. Build Your App

#### For Android (APK):
```bash
# Using EAS Build (recommended)
eas build --platform android --profile preview

# Or using Expo CLI
expo build:android
```

#### For iOS (IPA):
```bash
# Using EAS Build
eas build --platform ios --profile preview
```

### 4. Upload App to BrowserStack

```bash
# Upload APK/IPA to BrowserStack
yarn browserstack:upload path/to/your/app.apk

# This will output an App ID like: bs://abc123def456...
# Save this App ID to your .env file:
# BROWSERSTACK_APP_ID=bs://abc123def456...
```

### 5. Launch App Live Session

```bash
# Default device (iPhone 14 Pro)
yarn browserstack:live

# Specific Android device
yarn browserstack:live:android

# Specific iOS device
yarn browserstack:live:ios

# Custom device
yarn browserstack:live "Samsung Galaxy S22" "12.0"
```

### 6. Interact with Your App

Once the session starts, you'll get a URL. Open it in your browser to:
- See your app running on a real device
- Interact with it using mouse/touch
- Test on different devices without owning them
- Debug in real-time

## Available Scripts

| Script | Description |
|--------|-------------|
| `yarn browserstack:upload <path>` | Upload app to BrowserStack |
| `yarn browserstack:live` | Start App Live session (default device) |
| `yarn browserstack:live:android` | Start on Android device |
| `yarn browserstack:live:ios` | Start on iOS device |

## Supported Devices

### iOS Devices
- iPhone 14 Pro (iOS 16)
- iPhone 13 Pro (iOS 15)
- iPhone 12 Pro (iOS 14)
- iPad Pro (various iOS versions)

### Android Devices
- Samsung Galaxy S23 (Android 13)
- Google Pixel 7 (Android 13)
- Samsung Galaxy S22 (Android 12)
- OnePlus 9 (Android 11)

## Configuration

Edit `browserstack.config.js` to customize:
- Default devices
- Build names
- Timeout settings
- Test suite configuration

## Troubleshooting

### "App ID not found"
- Make sure you've uploaded your app first
- Check that `BROWSERSTACK_APP_ID` is set in `.env`
- Verify the App ID format: `bs://...`

### "Authentication failed"
- Verify your username and access key
- Check they're correctly set in `.env`
- Ensure no extra spaces or quotes

### "App file not found"
- Build your app first (APK or IPA)
- Provide the full path: `yarn browserstack:upload ./build/app.apk`
- Check file permissions

### Session doesn't start
- Verify your BrowserStack plan includes App Live
- Check device availability
- Try a different device/OS version

## Alternative: Web Version

If you just want to see the web version locally:

```bash
# Run Expo web version
yarn web

# Opens at http://localhost:8081
```

For BrowserStack web testing, use BrowserStack's Selenium/WebDriver tools.

## CI/CD Integration

To run BrowserStack tests in CI:

```yaml
# Example GitHub Actions
- name: Run BrowserStack Tests
  env:
    BROWSERSTACK_USERNAME: ${{ secrets.BROWSERSTACK_USERNAME }}
    BROWSERSTACK_ACCESS_KEY: ${{ secrets.BROWSERSTACK_ACCESS_KEY }}
    BROWSERSTACK_APP_ID: ${{ secrets.BROWSERSTACK_APP_ID }}
  run: |
    yarn browserstack:upload build/app.apk
    yarn browserstack:live
```

## Resources

- [BrowserStack App Live Docs](https://www.browserstack.com/docs/app-live)
- [BrowserStack API Reference](https://www.browserstack.com/docs/app-live/api-reference)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)

## Cost

BrowserStack offers:
- **Free Trial**: Limited minutes for testing
- **Paid Plans**: Starting at $29/month for individuals
- **Team Plans**: Custom pricing

Check [BrowserStack Pricing](https://www.browserstack.com/pricing) for details.
