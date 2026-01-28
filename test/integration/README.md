# Integration Tests

Frontend integration tests using Playwright with mocked backend APIs.

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

- `test/integration/` - Test files
- `test/integration/helpers/` - Test utilities and mocks
  - `mock-auth.ts` - Authentication mocking helpers

## Mocking Strategy

All backend APIs are mocked in tests:

- **OAuth/OIDC**: Mocked via localStorage manipulation
- **STAC API**: Mocked via route interception
- **Other APIs**: Mock as needed per test

## Writing Tests

Tests focus on:

- ✅ UI state changes
- ✅ User interactions
- ✅ Navigation flows
- ✅ Component visibility/behavior

Tests do NOT:

- ❌ Make real API calls
- ❌ Depend on external services
- ❌ Require OAuth credentials

## Example

```typescript
import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/mock-auth';

test('my test', async ({ page }) => {
  await mockAuthenticatedUser(page);
  await page.goto('/editor');

  // Your assertions here
});
```
