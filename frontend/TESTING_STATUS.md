# Testing Status

**Last Updated:** December 16, 2025

## Test Coverage

### Unit Tests

- **Status**: ⚠️ Written but blocked by jest-expo/React 19 compatibility
- **Test Files**: 9 test files
- **Coverage**: Configured (30% threshold)
- **Command**: `yarn test --passWithNoTests`

### E2E Tests (Maestro)

- **Status**: ✅ Test flows created, ready to run
- **Flows**: 3 smoke test flows
  - `browser-basic.yaml` - Basic browser navigation
  - `add-tab.yaml` - Tab management
  - `meta-rayban.yaml` - Meta Ray-Ban settings
- **Command**: `yarn uat` or `bash scripts/test-smoke.sh`
- **Requirements**:
  - Device/emulator connected
  - App installed (`npx expo start --dev-client`)

### Manual Testing

- **Status**: ⏳ Pending UAT
- **Checklist**: See `UAT_CHECKLIST.md`

## Running Tests

### Unit Tests

```bash
yarn test                    # Run all tests
yarn test:watch              # Watch mode
yarn test:coverage           # Coverage report
```

### Maestro E2E Tests

```bash
# Install Maestro (if needed)
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run smoke tests
yarn uat
# OR
bash scripts/test-smoke.sh
```

### Manual UAT

Follow the comprehensive checklist in `UAT_CHECKLIST.md`

## Test Results

### Last Run

- **Unit Tests**: Not run (jest-expo compatibility issue)
- **Maestro Tests**: Not run (requires device/emulator)
- **Manual UAT**: Not performed

## Next Steps

1. ✅ Fix jest-expo compatibility (waiting for library update)
2. ⏭️ Run Maestro tests on connected device
3. ⏭️ Perform manual UAT
4. ⏭️ Fix any issues found
5. ⏭️ Re-run tests before release

## Notes

- Maestro tests require:
  - Android device/emulator OR iOS simulator
  - App installed via dev client
  - App ID: `com.metachrome.app`
- To run Maestro tests:
  1. Start dev server: `npx expo start --dev-client`
  2. Install app on device
  3. Run: `yarn uat`
