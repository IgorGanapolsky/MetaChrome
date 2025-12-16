# Feature-Sliced Design (FSD) Structure Analysis

## Current Structure

Your project currently follows a **simple Expo Router structure**:

```
frontend/
├── app/                    # Expo Router pages (file-based routing)
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Main browser page
│   └── add-tab.tsx        # Add tab modal page
├── src/
│   └── context/           # React Context providers
│       └── BrowserContext.tsx
└── assets/                # Static assets
```

## Feature-Sliced Design (FSD) Best Practices (2025)

Feature-Sliced Design is a methodology for organizing frontend code that emphasizes:
- **Scalability**: Easy to add new features
- **Maintainability**: Clear separation of concerns
- **Reusability**: Shared code is properly organized
- **Testability**: Clear boundaries make testing easier

### Standard FSD Layers (from bottom to top):

1. **`app/`** - Application initialization, providers, routing
2. **`pages/`** - Full page components (compose widgets/features)
3. **`widgets/`** - Complex UI blocks (compose features/entities)
4. **`features/`** - Business features (user actions/interactions)
5. **`entities/`** - Business entities (domain models)
6. **`shared/`** - Shared code (UI kit, utilities, configs)

### FSD Segments (within each layer):

- `ui/` - UI components
- `model/` - Business logic, state management
- `api/` - API calls
- `lib/` - Utilities and helpers
- `config/` - Configuration
- `types/` - TypeScript types

## Issues with Current Structure

### ❌ Problems:

1. **No FSD layers**: Code is flat, everything is mixed
2. **Business logic in pages**: `app/index.tsx` contains 350+ lines with business logic
3. **Context in wrong place**: `src/context/` should be in `app/providers/` or `shared/lib/`
4. **No feature separation**: Browser functionality, tabs, voice commands all mixed together
5. **No entity layer**: BrowserTab, CommandLog types scattered
6. **No shared layer**: No reusable UI components, utilities, or types
7. **No widgets layer**: Complex UI blocks (tab bar, voice section) embedded in pages

## Recommended FSD Structure

```
frontend/
├── app/                          # Application layer
│   ├── _layout.tsx              # Root layout (Expo Router)
│   ├── providers/               # App-level providers
│   │   └── BrowserProvider.tsx  # Moved from src/context
│   └── [routes]/                # Expo Router routes
│       ├── index.tsx            # Browser page (thin wrapper)
│       └── add-tab.tsx          # Add tab page (thin wrapper)
│
├── pages/                        # Pages layer
│   └── browser/                 # Browser page composition
│       ├── index.tsx            # Page component (composes widgets)
│       └── ui/                  # Page-specific UI
│
├── widgets/                      # Widgets layer
│   ├── tab-bar/                 # Tab bar widget
│   │   ├── ui/
│   │   │   └── TabBar.tsx
│   │   └── index.ts
│   ├── browser-content/         # Browser content widget
│   │   ├── ui/
│   │   │   └── BrowserContent.tsx
│   │   └── index.ts
│   ├── voice-controls/          # Voice controls widget
│   │   ├── ui/
│   │   │   └── VoiceControls.tsx
│   │   └── index.ts
│   └── command-log/             # Command log widget
│       ├── ui/
│       │   └── CommandLog.tsx
│       └── index.ts
│
├── features/                     # Features layer
│   ├── add-tab/                 # Add tab feature
│   │   ├── ui/
│   │   │   └── AddTabForm.tsx
│   │   ├── model/
│   │   │   └── useAddTab.ts     # Hook for adding tabs
│   │   └── index.ts
│   ├── tab-management/          # Tab management feature
│   │   ├── model/
│   │   │   ├── useTabActions.ts
│   │   │   └── tabSlice.ts      # If using Zustand
│   │   └── index.ts
│   ├── voice-commands/          # Voice command feature
│   │   ├── model/
│   │   │   ├── useVoiceCommands.ts
│   │   │   └── commandHandlers.ts
│   │   └── index.ts
│   └── browser-controls/        # Browser control feature
│       ├── model/
│       │   └── useBrowserControls.ts
│       └── index.ts
│
├── entities/                     # Entities layer
│   ├── tab/                      # Tab entity
│   │   ├── model/
│   │   │   ├── types.ts         # BrowserTab type
│   │   │   └── tabStore.ts      # Tab state management
│   │   └── index.ts
│   ├── command/                  # Command entity
│   │   ├── model/
│   │   │   ├── types.ts         # CommandLog type
│   │   │   └── commandStore.ts
│   │   └── index.ts
│   └── browser/                  # Browser entity
│       ├── model/
│       │   └── types.ts
│       └── index.ts
│
└── shared/                       # Shared layer
    ├── ui/                       # Shared UI components
    │   ├── Button/
    │   ├── Input/
    │   ├── Card/
    │   └── index.ts
    ├── lib/                      # Utilities
    │   ├── utils/
    │   │   └── url.ts
    │   └── hooks/
    │       └── useHaptics.ts
    ├── api/                      # API clients
    │   └── client.ts
    ├── config/                   # Configuration
    │   └── constants.ts
    └── types/                    # Shared types
        └── index.ts
```

## Key Improvements Needed

### 1. **Separate Business Logic from UI**
   - Move logic from `app/index.tsx` to features/widgets
   - Use custom hooks for business logic

### 2. **Create Entity Layer**
   - Extract `BrowserTab` and `CommandLog` types to entities
   - Move state management to entity stores

### 3. **Create Feature Layer**
   - Split browser functionality into features:
     - `add-tab` - Adding new tabs
     - `tab-management` - Switching/closing tabs
     - `voice-commands` - Voice command handling
     - `browser-controls` - WebView interactions

### 4. **Create Widget Layer**
   - Extract complex UI blocks:
     - Tab bar
     - Browser content area
     - Voice controls section
     - Command log panel

### 5. **Create Shared Layer**
   - Extract reusable components
   - Create utility functions
   - Centralize constants and types

### 6. **Proper Context Organization**
   - Move `BrowserContext` to `app/providers/`
   - Or better: use Zustand stores in entities layer

## Migration Strategy

1. **Phase 1**: Create FSD folder structure
2. **Phase 2**: Extract entities (types, stores)
3. **Phase 3**: Extract features (business logic)
4. **Phase 4**: Extract widgets (UI blocks)
5. **Phase 5**: Refactor pages to compose widgets
6. **Phase 6**: Extract shared components/utilities

## Benefits of FSD Structure

✅ **Scalability**: Easy to add new features without touching existing code
✅ **Maintainability**: Clear boundaries make code easier to understand
✅ **Reusability**: Shared code is properly organized
✅ **Testability**: Each layer can be tested independently
✅ **Team Collaboration**: Multiple developers can work on different features
✅ **Code Discovery**: Easy to find where code lives

## December 2025 FSD Best Practices

1. **Use TypeScript strictly** - All layers should have proper types
2. **Index files** - Each layer/feature should export via `index.ts`
3. **Public API** - Only expose what's needed from each layer
4. **Layer imports** - Only import from lower layers (app → pages → widgets → features → entities → shared)
5. **Feature flags** - Use shared/config for feature flags
6. **State management** - Prefer Zustand/Redux Toolkit in entities/features
7. **API layer** - Centralize API calls in shared/api or features/api
8. **Testing** - Each layer should have its own tests

## Conclusion

Your current structure is **NOT following FSD best practices**. It's a simple Expo Router structure that will become hard to maintain as the project grows. 

**Recommendation**: Migrate to FSD structure for better scalability and maintainability.
