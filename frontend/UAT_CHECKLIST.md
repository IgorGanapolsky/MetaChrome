# User Acceptance Testing (UAT) Checklist

## Pre-Release Testing

### ✅ Core Functionality

#### Browser Tabs

- [ ] Can open new tab
- [ ] Can switch between tabs
- [ ] Can close tabs (except last one)
- [ ] Tab state persists on app restart
- [ ] Tab icons display correctly
- [ ] Tab names are readable

#### Voice Commands

- [ ] Voice button responds to taps
- [ ] Quick command buttons work
- [ ] Command execution shows feedback
- [ ] Command history displays correctly
- [ ] Custom commands can be created
- [ ] Custom commands execute correctly

#### Meta Ray-Ban Integration

- [ ] Settings page opens
- [ ] Connection status displays
- [ ] Wake word can be configured
- [ ] Haptic feedback toggle works
- [ ] Voice feedback toggle works
- [ ] Custom commands can be managed

#### Navigation

- [ ] Browser page loads correctly
- [ ] Add tab modal opens/closes
- [ ] Meta Ray-Ban settings modal opens/closes
- [ ] Back navigation works
- [ ] Deep linking works (if configured)

### ✅ Error Handling

- [ ] Error boundary catches crashes
- [ ] Error messages are user-friendly
- [ ] App recovers gracefully from errors
- [ ] Network errors handled properly
- [ ] Invalid URLs handled properly

### ✅ Performance

- [ ] App starts quickly (< 3 seconds)
- [ ] Tab switching is smooth (60fps)
- [ ] No memory leaks after extended use
- [ ] WebView loads pages efficiently
- [ ] No lag when scrolling

### ✅ UI/UX

- [ ] Dark theme displays correctly
- [ ] Text is readable on all screens
- [ ] Buttons are tappable (min 44x44pt)
- [ ] Icons are clear and recognizable
- [ ] Status indicators are visible
- [ ] Loading states are shown
- [ ] Empty states are informative

### ✅ Platform Specific

#### iOS

- [ ] Safe area insets respected
- [ ] Status bar styling correct
- [ ] Haptic feedback works
- [ ] Voice permissions requested

#### Android

- [ ] Edge-to-edge display works
- [ ] Status bar color correct
- [ ] Back button works
- [ ] Permissions requested properly

### ✅ Accessibility

- [ ] Screen reader compatible
- [ ] Touch targets are large enough
- [ ] Color contrast meets WCAG AA
- [ ] Text scales with system settings

### ✅ Production Readiness

- [ ] App builds successfully
- [ ] No console errors in production
- [ ] Analytics tracking works (if added)
- [ ] Error tracking works (Sentry)
- [ ] App store metadata complete
- [ ] Privacy policy available
- [ ] Terms of service available (if needed)

## Test Devices

### iOS

- [ ] iPhone 14 Pro (latest iOS)
- [ ] iPhone SE (small screen)
- [ ] iPad (tablet)

### Android

- [ ] Pixel 7 (latest Android)
- [ ] Samsung Galaxy S23
- [ ] Tablet device

## Sign-off

- [ ] All critical bugs fixed
- [ ] Performance acceptable
- [ ] UI/UX approved
- [ ] Ready for production release

**Tested by:** **\*\*\*\***\_**\*\*\*\***  
**Date:** **\*\*\*\***\_**\*\*\*\***  
**Approved:** **\*\*\*\***\_**\*\*\*\***
