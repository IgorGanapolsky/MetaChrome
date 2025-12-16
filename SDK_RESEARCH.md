# SDK Research for MetaChrome

## Meta Wearables Device Access Toolkit

**Status**: Developer Preview (available now)
**Publishing**: Limited to select partners during preview, broader release expected 2026

### What's Available NOW:
1. **Camera Access** - Via the toolkit SDK
2. **Microphone Access** - Via iOS/Android Bluetooth profiles (NOT via SDK directly)
3. **Speaker Access** - Via iOS/Android Bluetooth profiles (NOT via SDK directly)
4. **Mock Device Kit** - Test without hardware

### What's NOT Available:
- Custom "Hey Meta" voice commands (cannot create custom wake words for Meta AI)
- Meta Neural Band sensors
- Custom gesture controls (only standard events: pause, resume, stop)
- Display access (coming soon for Ray-Ban Display glasses)

### Supported Devices:
- Ray-Ban Meta
- Oakley Meta HSTN

### System Requirements:
- Android 10+
- iOS 15.2+ / Swift 6

### Key Insight:
> "You can access the device's microphones to create voice commands in your app, but you won't be able to create custom voice commands for Meta AI."

This means we CAN build our own voice command system using the glasses' mic via Bluetooth!

### Documentation:
- https://wearables.developer.meta.com/docs/develop/

---

## Integration Strategy

Since Meta SDK gives us:
- Camera via SDK
- Mic/Speaker via Bluetooth audio profiles

We need to:
1. Use standard Bluetooth audio APIs (not Meta SDK) for voice
2. Build our own speech recognition on the audio stream
3. Use Meta SDK only for camera features if needed

## Next: Research Google Assistant SDK and Siri integration options


---

## Google Assistant Integration (Android)

**App Actions** - The official way to integrate with Google Assistant on Android

### How It Works:
1. Define `<capability>` tags in `shortcuts.xml`
2. Map Built-in Intents (BIIs) to your app's functionality
3. User says "Hey Google, [action] on [App Name]"
4. Assistant launches your app with parameters

### Key Points:
- Requires Android 5+ (API 21)
- Must publish to Play Store
- Uses `shortcuts.xml` resource file
- Can display Android widgets in Assistant
- Supports deep linking to specific screens

### Limitation for React Native:
- App Actions require native Android configuration
- Need to create `shortcuts.xml` in the Android project
- Works with Expo (bare workflow or config plugins)

---

## iOS Siri Integration

### Options:
1. **Siri Shortcuts** - User-defined voice commands
2. **SiriKit / App Intents** - System-level voice integration

### React Native Libraries:
- `react-native-siri-shortcut` - Allows users to add shortcuts
- Expo: Need config plugin for Siri Intents capability

### How It Works:
1. Define App Intents in native code
2. User adds shortcut via "Add to Siri" button
3. User says custom phrase
4. App receives intent with parameters

### Key Insight:
Siri Shortcuts are USER-defined, not app-defined. The app suggests shortcuts, but users choose the voice phrase.

---

## Speech Recognition Options

### For Bluetooth Audio (Meta Ray-Ban):
The glasses' mic is accessed via standard Bluetooth audio profiles, NOT a special SDK.

### Libraries:
1. **@jamsch/expo-speech-recognition** - Already in our project!
   - Uses native Speech framework (iOS) and SpeechRecognizer (Android)
   - Should work with Bluetooth audio input automatically

2. **react-native-voice** - Alternative option
   - Known issue: May not use Bluetooth mic on some Android devices

3. **Whisper API** - For more accurate transcription
   - Requires sending audio to server
   - Better accuracy, but adds latency

### Key Issue Found:
> "When Bluetooth device is connected, the voice recognition is listening through the phone's Microphone and not the Bluetooth's device Microphone."

This is a known Android issue. Need to:
1. Set AudioManager to use Bluetooth SCO
2. Route audio input from Bluetooth device

---

## Architecture Decision

### Real Implementation Strategy:

1. **Voice Input**: 
   - Use `@jamsch/expo-speech-recognition` (already installed)
   - Configure audio routing to use Bluetooth mic when glasses connected
   - Implement wake word detection locally

2. **Meta Ray-Ban Connection**:
   - Use standard Bluetooth APIs (react-native-ble-plx or similar)
   - Connect as audio device for mic/speaker
   - No special Meta SDK needed for audio

3. **Google Assistant (Android)**:
   - Add App Actions via `shortcuts.xml`
   - Define BIIs for browser commands
   - Deep link to specific actions

4. **Siri (iOS)**:
   - Use `react-native-siri-shortcut`
   - Let users add custom voice shortcuts
   - Deep link to specific actions

5. **Text Input for Web Agents**:
   - Inject JavaScript into WebView
   - Find input fields and type text
   - Handle Claude, Cursor, etc. web interfaces
