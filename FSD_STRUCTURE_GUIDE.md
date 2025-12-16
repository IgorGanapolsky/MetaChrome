# Feature-Sliced Design Structure Guide

## Understanding FSD Layers

Think of FSD layers like building blocks stacked on top of each other:

```
┌─────────────────────────────────────┐
│         app/ (Application)         │  ← App initialization, routing, providers
├─────────────────────────────────────┤
│        pages/ (Pages)              │  ← Full page compositions
├─────────────────────────────────────┤
│       widgets/ (Widgets)           │  ← Complex UI blocks
├─────────────────────────────────────┤
│      features/ (Features)           │  ← User interactions & business logic
├─────────────────────────────────────┤
│      entities/ (Entities)           │  ← Domain models & data
├─────────────────────────────────────┤
│       shared/ (Shared)              │  ← Reusable utilities & UI
└─────────────────────────────────────┘
```

### Import Rules (Critical!)

**You can ONLY import from layers BELOW you:**

- ✅ `pages` can import from: `widgets`, `features`, `entities`, `shared`
- ✅ `widgets` can import from: `features`, `entities`, `shared`
- ✅ `features` can import from: `entities`, `shared`
- ✅ `entities` can import from: `shared`
- ✅ `shared` can import from: nothing (only external packages)
- ❌ **NEVER import UP** (e.g., `entities` importing from `features`)

## Current vs. Recommended Structure

### Current Structure (What You Have Now)

```
frontend/
├── app/                    # Expo Router pages
│   ├── index.tsx          # ❌ 350+ lines mixing UI + logic
│   └── add-tab.tsx        # ❌ UI + logic mixed
└── src/
    └── context/           # ❌ Context in wrong place
        └── BrowserContext.tsx
```

**Problems:**
- Everything is mixed together
- Hard to find code
- Hard to test
- Hard to reuse
- Will become unmaintainable as project grows

### Recommended FSD Structure

```
frontend/
├── app/                          # Application layer
│   ├── _layout.tsx              # Expo Router root layout
│   ├── providers/               # App-level providers
│   │   └── BrowserProvider.tsx
│   └── [routes]/                # Expo Router routes (thin wrappers)
│       ├── index.tsx            # → imports from pages/browser
│       └── add-tab.tsx          # → imports from pages/add-tab
│
├── pages/                        # Pages layer
│   ├── browser/                 # Browser page
│   │   ├── index.tsx            # Composes widgets
│   │   └── ui/                  # Page-specific UI (if needed)
│   └── add-tab/                 # Add tab page
│       ├── index.tsx            # Composes features/widgets
│       └── ui/
│
├── widgets/                      # Widgets layer
│   ├── tab-bar/                 # Tab bar widget
│   │   ├── ui/
│   │   │   └── TabBar.tsx       # UI component
│   │   └── index.ts             # Public exports
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
│   │   │   └── useAddTab.ts     # Business logic hook
│   │   └── index.ts
│   ├── tab-management/          # Tab management feature
│   │   ├── model/
│   │   │   ├── useTabActions.ts
│   │   │   └── tabSlice.ts      # Zustand slice
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
│   ├── tab/                     # Tab entity
│   │   ├── model/
│   │   │   ├── types.ts         # BrowserTab type
│   │   │   └── tabStore.ts      # Tab state (Zustand)
│   │   └── index.ts
│   ├── command/                 # Command entity
│   │   ├── model/
│   │   │   ├── types.ts         # CommandLog type
│   │   │   └── commandStore.ts
│   │   └── index.ts
│   └── browser/                 # Browser entity
│       ├── model/
│       │   └── types.ts
│       └── index.ts
│
└── shared/                       # Shared layer
    ├── ui/                       # Shared UI components
    │   ├── Button/
    │   │   ├── Button.tsx
    │   │   └── index.ts
    │   ├── Input/
    │   ├── Card/
    │   └── index.ts
    ├── lib/                      # Utilities
    │   ├── utils/
    │   │   ├── url.ts            # URL utilities
    │   │   └── format.ts
    │   └── hooks/
    │       └── useHaptics.ts
    ├── api/                      # API clients
    │   └── client.ts
    ├── config/                   # Configuration
    │   ├── constants.ts          # App constants
    │   └── routes.ts             # Route constants
    └── types/                    # Shared types
        └── index.ts
```

## Example: How Code Flows

### Current Flow (Bad):
```
app/index.tsx
  ├── Contains ALL logic (350+ lines)
  ├── Directly uses BrowserContext
  ├── Has UI, business logic, state management all mixed
  └── Hard to test, hard to reuse
```

### FSD Flow (Good):
```
app/index.tsx (thin wrapper)
  └── imports from pages/browser

pages/browser/index.tsx
  ├── imports TabBar from widgets/tab-bar
  ├── imports BrowserContent from widgets/browser-content
  ├── imports VoiceControls from widgets/voice-controls
  └── imports CommandLog from widgets/command-log

widgets/tab-bar/ui/TabBar.tsx
  ├── imports useTabActions from features/tab-management
  └── imports Tab type from entities/tab

features/tab-management/model/useTabActions.ts
  ├── imports tabStore from entities/tab
  └── imports useHaptics from shared/lib/hooks

entities/tab/model/tabStore.ts
  ├── imports Tab type from entities/tab/model/types
  └── uses Zustand for state
```

## Key Concepts

### 1. **app/** - Application Layer
- **Purpose**: App initialization, routing, global providers
- **Contains**: Root layouts, providers, route wrappers
- **Example**: `app/_layout.tsx`, `app/providers/BrowserProvider.tsx`

### 2. **pages/** - Pages Layer
- **Purpose**: Full page compositions
- **Contains**: Page components that compose widgets/features
- **Example**: `pages/browser/index.tsx` composes TabBar + BrowserContent widgets

### 3. **widgets/** - Widgets Layer
- **Purpose**: Complex, reusable UI blocks
- **Contains**: UI components that compose features/entities
- **Example**: `widgets/tab-bar/` - Tab bar that uses tab management feature

### 4. **features/** - Features Layer
- **Purpose**: User interactions and business logic
- **Contains**: Hooks, business logic, user actions
- **Example**: `features/add-tab/model/useAddTab.ts` - Logic for adding tabs

### 5. **entities/** - Entities Layer
- **Purpose**: Domain models and data
- **Contains**: Types, stores, data models
- **Example**: `entities/tab/model/types.ts` - BrowserTab type definition

### 6. **shared/** - Shared Layer
- **Purpose**: Reusable code across the app
- **Contains**: UI components, utilities, configs, types
- **Example**: `shared/ui/Button/` - Reusable button component

## Segments Within Layers

Each layer can have these segments:

```
feature-name/
├── ui/          # UI components
├── model/       # Business logic, hooks, stores
├── api/         # API calls (if feature-specific)
├── lib/         # Feature-specific utilities
├── config/      # Feature-specific config
├── types/       # Feature-specific types
└── index.ts     # Public API exports
```

**Not every feature needs all segments!** Only add what you need.

## Real Example: Refactoring Your Code

### Before (Current):
```tsx
// app/index.tsx (350+ lines)
export default function Browser() {
  const { tabs, activeTabId, setActiveTab, ... } = useBrowser();
  // ... 300+ more lines of mixed UI and logic
}
```

### After (FSD):
```tsx
// app/index.tsx (thin wrapper)
import { BrowserPage } from '@/pages/browser';

export default function Browser() {
  return <BrowserPage />;
}

// pages/browser/index.tsx (composes widgets)
import { TabBar } from '@/widgets/tab-bar';
import { BrowserContent } from '@/widgets/browser-content';
import { VoiceControls } from '@/widgets/voice-controls';
import { CommandLog } from '@/widgets/command-log';

export function BrowserPage() {
  return (
    <SafeAreaView>
      <TabBar />
      <BrowserContent />
      <VoiceControls />
      <CommandLog />
    </SafeAreaView>
  );
}

// widgets/tab-bar/ui/TabBar.tsx (uses features)
import { useTabActions } from '@/features/tab-management';
import { useTabs } from '@/entities/tab';

export function TabBar() {
  const tabs = useTabs();
  const { switchTab, closeTab } = useTabActions();
  // ... UI only
}

// features/tab-management/model/useTabActions.ts (business logic)
import { useTabStore } from '@/entities/tab';
import { useHaptics } from '@/shared/lib/hooks';

export function useTabActions() {
  const { setActiveTab, removeTab } = useTabStore();
  const { impact } = useHaptics();
  
  const switchTab = (id: string) => {
    impact('light');
    setActiveTab(id);
  };
  
  return { switchTab, closeTab: removeTab };
}

// entities/tab/model/tabStore.ts (state management)
import { create } from 'zustand';
import type { BrowserTab } from './types';

export const useTabStore = create((set) => ({
  tabs: [],
  activeTabId: null,
  setActiveTab: (id) => set({ activeTabId: id }),
  // ...
}));
```

## Benefits You'll Get

1. **Findability**: Know exactly where code lives
2. **Reusability**: Easy to reuse widgets/features
3. **Testability**: Test each layer independently
4. **Scalability**: Add features without touching existing code
5. **Maintainability**: Clear boundaries make refactoring easier
6. **Team Collaboration**: Multiple devs can work on different features

## Common Mistakes to Avoid

❌ **Don't**: Put business logic in pages/widgets
✅ **Do**: Put business logic in features

❌ **Don't**: Import from higher layers
✅ **Do**: Only import from lower layers

❌ **Don't**: Mix UI and logic in same file
✅ **Do**: Separate UI (ui/) from logic (model/)

❌ **Don't**: Put everything in shared
✅ **Do**: Only truly shared code goes in shared

❌ **Don't**: Create deep nesting
✅ **Do**: Keep structure flat (max 2-3 levels deep)

## Next Steps

1. Read the full analysis: `FSD_ANALYSIS.md`
2. Plan your migration (start with entities, then features, then widgets)
3. Refactor incrementally (one feature at a time)
4. Set up path aliases (`@/pages`, `@/widgets`, etc.)
5. Consider using FSD tooling (like `@feature-sliced/eslint-config`)
