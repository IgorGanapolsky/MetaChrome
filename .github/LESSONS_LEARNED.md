# Lessons Learned - MetaChrome

Machine-readable lessons for RAG/ML pipelines. Format: problem → root cause → solution → prevention.

---

## Issue #1: EAS Builds Failing (iOS & Android)

**Date**: 2024-12-16
**Severity**: Critical
**Time to Resolve**: ~30 minutes

### Problem
Both iOS and Android EAS builds were failing without clear error messages.

### Root Cause
**Config precedence mismatch**: When both `app.json` and `app.config.js` exist in an Expo project, `app.config.js` takes precedence and `app.json` is ignored.

The `app.config.js` was missing:
- `owner` field (required for EAS)
- Custom plugins: `@jamsch/expo-speech-recognition`, `expo-build-properties`, `./plugins/withMetaChrome.js`, `./plugins/withAccessibilityService.js`
- Full Bluetooth permissions for Android
- iOS infoPlist configurations

### Solution
1. Synced `app.config.js` with all configurations from `app.json`
2. Fixed invalid Node.js version (`20.19.4` → `20.18.0`)

### Prevention
1. Added `scripts/validate-expo-config.js` - validates config completeness
2. Added `yarn validate:config` npm script
3. Added CI step to run validation before EAS builds
4. **Key rule**: If using `app.config.js`, treat `app.json` as dead code

### Tags
`expo`, `eas-build`, `config`, `ios`, `android`, `plugins`, `ci-prevention`

---

## Common Expo/EAS Build Checklist

Use this checklist before any EAS build:

- [ ] `owner` field present in config
- [ ] `extra.eas.projectId` present
- [ ] All custom plugins listed
- [ ] iOS `bundleIdentifier` matches across files
- [ ] Android `package` matches across files
- [ ] Node version in `eas.json` is valid (check https://nodejs.org/en/about/previous-releases)
- [ ] Run `yarn validate:config` locally

---

## RAG Metadata

```json
{
  "type": "lessons_learned",
  "project": "MetaChrome",
  "technologies": ["expo", "react-native", "eas", "ios", "android"],
  "keywords": ["build failure", "config mismatch", "app.config.js", "app.json", "plugins"],
  "confidence": 1.0,
  "verified": true
}
```
