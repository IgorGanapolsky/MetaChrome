# MetaChrome

A voice-controlled browser app designed for Meta Ray-Ban smart glasses.

## Features

- 🎤 **Voice Control** - Hands-free browsing with Meta Ray-Ban integration
- 🌐 **Smart Tabs** - Multiple browser tabs with easy management
- ⚡ **Performance** - Optimized for smart glasses
- 🎯 **Customization** - Create your own voice commands
- 🌙 **Dark Theme** - Optimized dark theme for extended use

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand
- **Architecture**: Feature-Sliced Design (FSD)
- **Testing**: Jest + React Native Testing Library + Maestro (E2E)
- **Error Tracking**: Sentry
- **Code Quality**: ESLint + Prettier + Husky

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn
- Expo CLI
- iOS Simulator / Android Emulator (or physical device)

### Installation

```bash
# Install dependencies
yarn install

# Start development server
yarn start

# Run on iOS
yarn ios

# Run on Android
yarn android
```

## Development

### Project Structure

```
frontend/
├── app/              # Expo Router routes
├── src/
│   ├── pages/       # Page components
│   ├── widgets/     # Complex UI components
│   ├── features/    # Business logic features
│   ├── entities/    # Business entities (stores)
│   ├── shared/      # Shared utilities, hooks, UI
│   ├── theme/       # Design tokens
│   └── types/       # TypeScript types
├── maestro/         # E2E test flows
└── scripts/         # Build and utility scripts
```

### Scripts

```bash
# Development
yarn start                    # Start Expo dev server
npx expo start --dev-client  # Start with dev client
yarn ios                      # Run on iOS
yarn android                  # Run on Android

# Code Quality
yarn lint                    # Run ESLint
yarn lint:fix                # Fix ESLint errors
yarn format                  # Format with Prettier
yarn typecheck               # Type check with TypeScript

# Testing
yarn test                    # Run unit tests
yarn test:watch              # Watch mode
yarn test:coverage           # Coverage report
yarn uat                     # Run E2E tests (Maestro)

# Production Builds
eas build --platform ios --profile production     # Build iOS
eas build --platform android --profile production # Build Android
yarn build:production                             # Build both platforms
```

## Testing

### Unit Tests
```bash
yarn test
```

### E2E Tests
```bash
# Install Maestro CLI first
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run tests
yarn uat
```

### Manual UAT
See [UAT_CHECKLIST.md](./UAT_CHECKLIST.md) for comprehensive testing checklist.

## Building for Production

### Prerequisites
- EAS account (expo.dev)
- Sentry account (for error tracking)

### Setup

1. **Configure EAS**
   ```bash
   eas login
   eas init
   ```

2. **Set Environment Variables**
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your values
   ```

3. **Build**
   ```bash
   yarn build:production
   ```

## Architecture

This project follows **Feature-Sliced Design (FSD)** methodology:

- **app/** - Expo Router routes (entry points)
- **pages/** - Full page compositions
- **widgets/** - Complex UI components
- **features/** - Business logic features
- **entities/** - Business entities (Zustand stores)
- **shared/** - Shared utilities, hooks, UI components

### Import Rules

- ✅ `pages` can import from `widgets`, `features`, `entities`, `shared`
- ✅ `widgets` can import from `features`, `entities`, `shared`
- ✅ `features` can import from `entities`, `shared`
- ✅ `entities` can import from `shared`
- ❌ No circular dependencies
- ❌ No imports from higher layers

## Production Readiness

See [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) for detailed status.

**Current Status: 75% Ready**

- ✅ Architecture: Excellent
- ✅ Code Quality: Good
- ⚠️ Tests: Infrastructure issue (tests written, blocked by jest-expo)
- ✅ Documentation: Complete
- ⚠️ Configuration: Needs Sentry/EAS setup

## Release Process

See [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) for step-by-step release guide.

## Contributing

1. Follow Feature-Sliced Design principles
2. Write tests for new features
3. Run `yarn lint` and `yarn format` before committing
4. Follow TypeScript strict mode
5. Update documentation as needed

## License

Private - All rights reserved

## Support

For issues and questions, please contact through the app store listing.
