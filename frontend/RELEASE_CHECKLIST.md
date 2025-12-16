# Release Checklist

## Pre-Release (Before Building)

### Code Quality
- [x] TypeScript errors fixed (0 errors)
- [x] ESLint passes
- [x] Prettier formatting applied
- [x] Code reviewed

### Configuration
- [ ] Set EAS_PROJECT_ID in environment
- [ ] Configure Sentry DSN
- [ ] Update version numbers
- [ ] Review app.json configuration
- [ ] Test app.config.js

### Testing
- [ ] Run `yarn test` (may show warnings due to jest-expo issue)
- [ ] Run `yarn uat` (E2E tests)
- [ ] Manual testing on iOS device
- [ ] Manual testing on Android device
- [ ] Test Meta Ray-Ban integration
- [ ] Test all voice commands
- [ ] Test error scenarios

### Documentation
- [x] Privacy policy written
- [x] UAT checklist created
- [x] App store metadata prepared
- [ ] Screenshots created
- [ ] App icon finalized

## Build Phase

### iOS Build
```bash
eas build --platform ios --profile production
```
- [ ] Build succeeds
- [ ] TestFlight upload works
- [ ] App installs on test devices

### Android Build
```bash
eas build --platform android --profile production
```
- [ ] Build succeeds
- [ ] APK/AAB generated
- [ ] App installs on test devices

## Pre-Submission

### App Store Connect (iOS)
- [ ] App information complete
- [ ] Screenshots uploaded (all required sizes)
- [ ] App preview video (optional)
- [ ] Description and keywords
- [ ] Privacy policy URL set
- [ ] Support URL set
- [ ] Age rating completed
- [ ] Pricing set
- [ ] App review information

### Google Play Console (Android)
- [ ] Store listing complete
- [ ] Screenshots uploaded
- [ ] Feature graphic
- [ ] Description
- [ ] Privacy policy URL
- [ ] Content rating
- [ ] Pricing

### Final Checks
- [ ] Test production build thoroughly
- [ ] Verify error tracking works
- [ ] Check analytics (if enabled)
- [ ] Test on multiple devices
- [ ] Verify all features work
- [ ] Check performance
- [ ] Verify no console errors

## Submission

### iOS
- [ ] Submit for App Review
- [ ] Answer any review questions
- [ ] Monitor review status

### Android
- [ ] Create release
- [ ] Upload AAB
- [ ] Complete release notes
- [ ] Submit for review
- [ ] Monitor review status

## Post-Release

### Monitoring
- [ ] Set up Sentry alerts
- [ ] Monitor crash reports
- [ ] Track user feedback
- [ ] Monitor app store reviews

### Updates
- [ ] Plan next version
- [ ] Address critical bugs
- [ ] Gather user feedback
- [ ] Plan feature updates

## Version History

### v1.0.0 (Initial Release)
- Meta Ray-Ban integration
- Voice command support
- Custom command creation
- Tab management
- Dark theme
