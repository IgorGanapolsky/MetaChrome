# Current Structure vs. Feature-Sliced Design

## Visual Comparison

### 🔴 CURRENT STRUCTURE (What You Have)

```
frontend/
│
├── app/                          ← Expo Router (file-based routing)
│   ├── _layout.tsx              ← Root layout + providers mixed
│   ├── index.tsx                ← ❌ 350+ lines: UI + Logic + State
│   │   ├── Tab bar UI
│   │   ├── Browser content UI
│   │   ├── Voice controls UI
│   │   ├── Command log UI
│   │   ├── Tab management logic
│   │   ├── Voice command logic
│   │   └── Browser control logic
│   └── add-tab.tsx              ← ❌ UI + Logic mixed
│       ├── Form UI
│       └── Add tab logic
│
└── src/
    └── context/
        └── BrowserContext.tsx   ← ❌ Context in wrong place
            ├── Tab state
            ├── Command state
            ├── Browser logic
            └── All mixed together
```

**Problems:**
- ❌ Everything in one place
- ❌ Hard to find code
- ❌ Hard to test
- ❌ Hard to reuse
- ❌ Will break as project grows

---

### 🟢 FSD STRUCTURE (What You Should Have)

```
frontend/
│
├── app/                          ← Application layer (Expo Router)
│   ├── _layout.tsx              ← Thin wrapper: routing only
│   ├── providers/               ← App-level providers
│   │   └── BrowserProvider.tsx  ← Moved from src/context
│   └── [routes]/                ← Thin route wrappers
│       ├── index.tsx            ← → imports pages/browser
│       └── add-tab.tsx          ← → imports pages/add-tab
│
├── pages/                        ← Pages layer
│   ├── browser/
│   │   └── index.tsx            ← ✅ Composes widgets (thin)
│   │       ├── <TabBar />
│   │       ├── <BrowserContent />
│   │       ├── <VoiceControls />
│   │       └── <CommandLog />
│   └── add-tab/
│       └── index.tsx            ← ✅ Composes features/widgets
│
├── widgets/                      ← Widgets layer
│   ├── tab-bar/
│   │   ├── ui/TabBar.tsx        ← ✅ UI only
│   │   └── index.ts
│   ├── browser-content/
│   │   ├── ui/BrowserContent.tsx
│   │   └── index.ts
│   ├── voice-controls/
│   │   ├── ui/VoiceControls.tsx
│   │   └── index.ts
│   └── command-log/
│       ├── ui/CommandLog.tsx
│       └── index.ts
│
├── features/                     ← Features layer
│   ├── add-tab/
│   │   ├── ui/AddTabForm.tsx    ← ✅ UI component
│   │   ├── model/useAddTab.ts   ← ✅ Business logic hook
│   │   └── index.ts
│   ├── tab-management/
│   │   ├── model/
│   │   │   ├── useTabActions.ts ← ✅ Tab actions logic
│   │   │   └── tabSlice.ts      ← ✅ Zustand slice
│   │   └── index.ts
│   ├── voice-commands/
│   │   ├── model/
│   │   │   ├── useVoiceCommands.ts
│   │   │   └── commandHandlers.ts
│   │   └── index.ts
│   └── browser-controls/
│       ├── model/useBrowserControls.ts
│       └── index.ts
│
├── entities/                     ← Entities layer
│   ├── tab/
│   │   ├── model/
│   │   │   ├── types.ts         ← ✅ BrowserTab type
│   │   │   └── tabStore.ts      ← ✅ Tab state (Zustand)
│   │   └── index.ts
│   ├── command/
│   │   ├── model/
│   │   │   ├── types.ts         ← ✅ CommandLog type
│   │   │   └── commandStore.ts  ← ✅ Command state
│   │   └── index.ts
│   └── browser/
│       ├── model/types.ts
│       └── index.ts
│
└── shared/                       ← Shared layer
    ├── ui/                       ← ✅ Reusable UI components
    │   ├── Button/
    │   ├── Input/
    │   └── Card/
    ├── lib/                      ← ✅ Utilities
    │   ├── utils/url.ts
    │   └── hooks/useHaptics.ts
    ├── api/client.ts
    ├── config/constants.ts
    └── types/index.ts
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Easy to find code
- ✅ Easy to test
- ✅ Easy to reuse
- ✅ Scales with project growth

---

## Code Size Comparison

### Current: `app/index.tsx`
```
❌ 350+ lines
   ├── UI components (150 lines)
   ├── Business logic (100 lines)
   ├── State management (50 lines)
   └── Styles (50 lines)
```

### FSD: Split Across Layers
```
✅ app/index.tsx (10 lines)          ← Thin wrapper
✅ pages/browser/index.tsx (30 lines) ← Composes widgets
✅ widgets/tab-bar/ui/TabBar.tsx (50 lines) ← UI only
✅ features/tab-management/model/useTabActions.ts (30 lines) ← Logic only
✅ entities/tab/model/tabStore.ts (40 lines) ← State only
```

**Total: Same functionality, better organized!**

---

## Import Flow Comparison

### Current (Bad):
```tsx
// app/index.tsx
import { useBrowser } from '../src/context/BrowserContext';
// Everything imported from one place
// Hard to understand dependencies
```

### FSD (Good):
```tsx
// app/index.tsx
import { BrowserPage } from '@/pages/browser';

// pages/browser/index.tsx
import { TabBar } from '@/widgets/tab-bar';
import { BrowserContent } from '@/widgets/browser-content';

// widgets/tab-bar/ui/TabBar.tsx
import { useTabActions } from '@/features/tab-management';
import { useTabs } from '@/entities/tab';

// features/tab-management/model/useTabActions.ts
import { useTabStore } from '@/entities/tab';
import { useHaptics } from '@/shared/lib/hooks';

// Clear dependency flow: app → pages → widgets → features → entities → shared
```

---

## Finding Code Comparison

### Current: "Where is the tab switching logic?"
```
🤔 Is it in app/index.tsx? (350 lines, hard to find)
🤔 Is it in src/context/BrowserContext.tsx? (300 lines)
🤔 Maybe it's mixed in both?
```

### FSD: "Where is the tab switching logic?"
```
✅ features/tab-management/model/useTabActions.ts
   → Clear location, easy to find!
```

---

## Testing Comparison

### Current:
```tsx
// Hard to test - everything is coupled
test('tab switching', () => {
  // Need to render entire app/index.tsx (350 lines)
  // Need to mock BrowserContext
  // Hard to isolate logic
});
```

### FSD:
```tsx
// Easy to test - each layer isolated
test('useTabActions', () => {
  // Test only the hook
  // Mock entities/tab
  // Clear, focused test
});

test('TabBar component', () => {
  // Test only the UI
  // Mock features/tab-management
  // Clear, focused test
});
```

---

## Adding New Feature Comparison

### Current: Add "Bookmarks" feature
```
❌ Modify app/index.tsx (already 350 lines!)
❌ Modify src/context/BrowserContext.tsx (already 300 lines!)
❌ Risk breaking existing code
❌ Hard to review changes
```

### FSD: Add "Bookmarks" feature
```
✅ Create features/bookmarks/
✅ Create entities/bookmark/
✅ Add widget if needed
✅ No changes to existing code!
✅ Easy to review
✅ Easy to test
```

---

## Summary

| Aspect | Current | FSD |
|--------|---------|-----|
| **Organization** | ❌ Flat, mixed | ✅ Layered, separated |
| **Findability** | ❌ Hard to find | ✅ Easy to find |
| **Testability** | ❌ Hard to test | ✅ Easy to test |
| **Reusability** | ❌ Hard to reuse | ✅ Easy to reuse |
| **Scalability** | ❌ Will break | ✅ Scales well |
| **Maintainability** | ❌ Hard to maintain | ✅ Easy to maintain |
| **Team Collaboration** | ❌ Conflicts | ✅ Parallel work |

---

## Recommendation

**Start migrating to FSD structure now**, before your project grows larger. The longer you wait, the harder it becomes.

**Start with:**
1. Create folder structure
2. Extract entities (types & stores)
3. Extract features (business logic)
4. Extract widgets (UI blocks)
5. Refactor pages (thin wrappers)

See `FSD_SUMMARY.md` for detailed migration steps.
