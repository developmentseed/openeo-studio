# Tests

This project uses two testing frameworks:

## Jest (Unit/Component Tests)

**Location:** `test/components/` and `app/` (co-located)  
**File pattern:** `*.test.ts`, `*.test.tsx`  
**Run:** `pnpm test`

Tests React components, utilities, and business logic in isolation.

### Example

```typescript
// test/components/button.test.tsx
describe('Button', () => {
  it('renders correctly', () => {
    // test implementation
  });
});
```

## Playwright (Integration Tests)

**Location:** `test/integration/`  
**File pattern:** `*.spec.ts`  
**Run:** `pnpm test:integration:ui`

Tests frontend user flows with mocked backend APIs.

### Example

```typescript
// test/integration/auth.spec.ts
test('shows login dialog', async ({ page }) => {
  // test implementation
});
```

## File Naming Convention

- `.test.ts/.test.tsx` → Jest unit/component tests
- `.spec.ts` → Playwright integration tests

This separation ensures:

- ✅ Clear test type identification
- ✅ No test runner conflicts
- ✅ Proper test isolation
