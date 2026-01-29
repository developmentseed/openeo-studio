# Integration Tests

Frontend integration tests using Playwright with mocked backend APIs and authentication.

## Running Tests

```bash
# Run all tests (headless)
pnpm test:integration

# Run tests with UI mode (recommended for development)
pnpm test:integration:ui

# Run tests in headed mode (see the browser)
pnpm test:integration:headed

# Debug specific test
pnpm test:integration:debug

# Run specific test file
pnpm test:integration auth.spec.ts
```

## Test Structure

- `test/integration/*.spec.ts` - Test specifications (e.g., `auth.spec.ts`)
- `test/integration/__mocks__/` - Mock components and utilities
- `test/integration/__fixtures__/` - Test setup, configuration, and fixtures

## Mocking Strategy

### Authentication

- **MockAuthProvider** (`test/integration/__mocks__/auth-provider.tsx`) - Provides mock OIDC context when `window.__MOCK_AUTH__` is set
- **Fixtures** (`test/integration/__fixtures__/index.ts`) - Playwright fixtures inject `window.__MOCK_AUTH__` via `page.addInitScript()` before app loads
- **Main app** (`app/main.tsx`) - Conditionally uses `MockAuthProvider` or real `AuthProvider` based on `window.__MOCK_AUTH__`

### Python Runtime

- **Pyodide Mock** (`test/integration/__fixtures__/index.ts`) - Mocks `window.loadPyodide` to prevent WebAssembly memory allocation errors during tests
- Applied to all tests via the `page` fixture override

### Other APIs

- **STAC API**: Mocked via route interception as needed

## Writing Tests

Tests focus on:

- ✅ UI state changes
- ✅ User interactions
- ✅ Navigation flows
- ✅ Component visibility/behavior

Tests do NOT:

- ❌ Make real OIDC auth calls
- ❌ Load Pyodide (WebAssembly runtime)
- ❌ Depend on external services
- ❌ Require OAuth credentials
