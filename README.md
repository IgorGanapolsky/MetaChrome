# MetaChrome

A voice-controlled mobile browser app with Meta Ray-Ban smart glasses integration.

## Features

- **Voice Commands**: Control your browser with custom voice commands
- **Meta Ray-Ban Integration**: Connect your Meta Ray-Ban smart glasses for hands-free browsing
- **Custom Commands**: Create, edit, and manage your own voice commands
- **Tab Management**: Manage multiple browser tabs with voice or touch
- **WebView Browser**: Full-featured in-app browser

## Tech Stack

- **Expo** (SDK 54)
- **React Native** (0.79.5)
- **TypeScript**
- **Zustand** (State Management)
- **AsyncStorage** (Local Persistence)

## Getting Started

```bash
cd frontend
yarn install
yarn start
```

## Project Structure

```
frontend/
├── app/                    # Expo Router pages
├── src/
│   ├── entities/          # Data models & stores
│   ├── features/          # Feature logic
│   ├── pages/             # Page components
│   ├── widgets/           # UI components
│   ├── shared/            # Shared utilities
│   └── theme/             # Theme configuration
└── assets/                # Images & fonts
```

## License

MIT
