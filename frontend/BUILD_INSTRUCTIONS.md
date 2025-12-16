# Build Instructions

## EAS Configuration

**Project ID:** `04975b9f-98b0-4dd1-9038-ee96259801ac`  
**Access Token:** Configured in `.env.production` (do not commit)

## Development Build

### Start Development Server
```bash
npx expo start --dev-client
```

This starts the Expo development server with dev client support, allowing you to test native features.

### Alternative Commands
```bash
yarn start              # Standard Expo start
yarn ios                # Run on iOS simulator
yarn android            # Run on Android emulator
```

## Production Builds

### iOS Production Build
```bash
eas build --platform ios --profile production
```

**Requirements:**
- EAS CLI installed: `npm install -g eas-cli`
- Logged in: `eas login`
- Apple Developer account configured
- EAS Project ID configured in `app.json`

**Output:**
- Build will be uploaded to EAS servers
- Download link provided after build completes
- Can be submitted to App Store Connect

### Android Production Build
```bash
eas build --platform android --profile production
```

**Requirements:**
- EAS CLI installed: `npm install -g eas-cli`
- Logged in: `eas login`
- Google Play Developer account configured
- EAS Project ID configured in `app.json`

**Output:**
- APK or AAB file generated
- Uploaded to EAS servers
- Can be submitted to Google Play Console

### Build Both Platforms
```bash
yarn build:production
```

This runs both iOS and Android builds sequentially.

## Environment Setup

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to EAS
```bash
eas login
```

Use your Expo account credentials or the access token:
```bash
export EXPO_TOKEN=fl-nWl2ipGwFHsOLRRwkoFnBQnWRmyRxvuPbzm79
```

### 3. Configure Environment Variables
Copy `.env.production.example` to `.env.production` and fill in:
- EAS_PROJECT_ID (already set)
- EXPO_TOKEN (already set)
- Sentry DSN (when ready)
- Other optional variables

### 4. Verify Configuration
```bash
eas build:configure
```

## Build Profiles

See `eas.json` for build profiles:
- **development**: Dev client builds
- **preview**: Internal distribution
- **production**: App store builds

## Troubleshooting

### Build Fails
1. Check EAS project ID is correct in `app.json`
2. Verify access token is valid
3. Check build logs: `eas build:list`
4. Review error messages in EAS dashboard

### Missing Dependencies
```bash
yarn install
```

### TypeScript Errors
```bash
yarn typecheck
```

### Clear Cache
```bash
npx expo start --clear
```

## Next Steps After Build

1. **Test Build**
   - Download build from EAS dashboard
   - Install on test device
   - Run UAT checklist

2. **Submit to Stores**
   - iOS: Use EAS Submit or App Store Connect
   - Android: Use EAS Submit or Google Play Console

3. **Monitor**
   - Check Sentry for errors
   - Review analytics
   - Monitor app store reviews

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npx expo start --dev-client` | Start dev server |
| `eas build --platform ios --profile production` | Build iOS |
| `eas build --platform android --profile production` | Build Android |
| `eas build:list` | List all builds |
| `eas build:view` | View build details |
| `eas submit --platform ios` | Submit to App Store |
| `eas submit --platform android` | Submit to Play Store |
