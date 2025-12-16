# Meta Ray-Ban Integration Research

## Meta Wearables Device Access Toolkit

### Key Capabilities
- **Camera Access**: Available via toolkit for Ray-Ban Meta and Oakley Meta HSTN
- **Microphone & Speakers**: Accessible via iOS/Android Bluetooth profiles
- **Voice Commands**: Can access device microphones to create voice commands in your app
- **Custom Voice Commands for Meta AI**: NOT available - cannot create custom voice commands for Meta AI
- **Gesture Controls**: Standard events like pause, resume, stop are available (not custom gestures)

### Important Limitations
1. "Hey Meta" invocations will NOT be part of the toolkit this year
2. Cannot create custom voice commands for Meta AI directly
3. Can only listen for standard events (pause, resume, stop)

### What We CAN Do
1. Access the device's microphones to create voice commands in our app
2. Use Bluetooth audio profiles for mic/speaker access
3. Integrate with Llama API for AI capabilities
4. Build camera and audio experiences

### System Requirements
- Android 10+ or iOS 15.2+/Swift6
- Same requirements as Meta AI app

### SDK Documentation
- Full docs: https://wearables.developer.meta.com/docs/develop/
- Mock Device Kit available for testing without hardware

## Implementation Strategy for MetaChrome

Since we cannot directly integrate with "Hey Meta" voice commands, we can:

1. **Create a "Meta Ray-Ban Mode"** in the app that:
   - Connects to Ray-Ban Meta glasses via Bluetooth
   - Uses the glasses' microphone for voice input
   - Processes voice commands through our own voice recognition
   - Sends audio responses through the glasses' speakers

2. **Custom Voice Command System**:
   - Allow users to define custom trigger phrases
   - Map phrases to browser actions (open tab, navigate, scroll, etc.)
   - Store custom commands in the backend

3. **Integration Approach**:
   - Use Bluetooth audio profiles for mic/speaker access
   - Implement our own wake word detection or button-triggered listening
   - Process commands through our existing voice command infrastructure
