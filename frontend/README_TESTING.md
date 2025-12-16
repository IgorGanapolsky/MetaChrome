# Testing Guide

This project follows Test-Driven Development (TDD) principles and includes unit tests, integration tests, and E2E smoke tests.

## Test Structure

```
frontend/
├── src/
│   ├── entities/
│   │   └── **/__tests__/     # Entity unit tests
│   ├── features/
│   │   └── **/__tests__/     # Feature unit tests
│   ├── widgets/
│   │   └── **/__tests__/     # Widget component tests
│   └── shared/
│       └── **/__tests__/      # Utility tests
├── maestro/                   # Maestro E2E tests
│   └── flows/
└── jest.config.js             # Jest configuration
```

## Running Tests

### Unit Tests

```bash
# Run all tests
yarn test

# Watch mode
yarn test:watch

# Coverage report
yarn test:coverage

# CI mode (with coverage)
yarn test:ci
```

### E2E Tests (Maestro)

1. Install Maestro CLI:

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

2. Run smoke tests:

```bash
maestro test maestro/flows/browser-basic.yaml
maestro test maestro/flows/add-tab.yaml

# Run all tests
maestro test maestro.yaml
```

3. Record new flows:

```bash
maestro record maestro/flows/new-flow.yaml
```

## Test Coverage

Current coverage thresholds:

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Pre-commit Hooks

Pre-commit hooks automatically run:

- ESLint (with auto-fix)
- Jest tests for changed files
- Prettier for JSON/MD files

To skip hooks (not recommended):

```bash
git commit --no-verify
```

## Writing Tests

### TDD Workflow

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code while keeping tests green

### Example: Entity Test

```typescript
// entities/tab/__tests__/tabStore.test.ts
describe('TabStore', () => {
  it('should add a new tab', () => {
    const { result } = renderHook(() => useTabStore());

    act(() => {
      result.current.addTab(newTab);
    });

    expect(result.current.tabs).toHaveLength(1);
  });
});
```

### Example: Feature Test

```typescript
// features/tab-management/__tests__/useTabActions.test.ts
describe('useTabActions', () => {
  it('should switch tab with haptic feedback', () => {
    const { result } = renderHook(() => useTabActions());

    act(() => {
      result.current.switchTab('2');
    });

    expect(mockSetActiveTab).toHaveBeenCalled();
  });
});
```

### Example: Widget Test

```typescript
// widgets/tab-bar/__tests__/TabBar.test.tsx
describe('TabBar', () => {
  it('should render all tabs', () => {
    const { getByText } = render(<TabBar />);
    expect(getByText('Claude')).toBeTruthy();
  });
});
```

## Maestro E2E Tests

Maestro tests are written in YAML and test the full user flow:

```yaml
# maestro/flows/browser-basic.yaml
- launchApp
- assertVisible: 'Meta Chrome'
- tapOn: 'GitHub'
- assertVisible: 'GitHub'
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Isolation**: Each test should be independent
4. **Cleanup**: Use `beforeEach`/`afterEach` for setup/teardown
5. **Descriptive Names**: Test names should describe what they test
6. **No Meaningless Comments**: Code should be self-explanatory

## CI/CD Integration

Tests run automatically in CI:

- Unit tests on every PR
- Coverage reports generated
- Maestro smoke tests on release builds
