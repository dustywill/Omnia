# Testing Documentation

This folder contains testing strategies, guides, and test plans for Omnia.

## Testing Strategy

Omnia uses a multi-layer testing approach:

1. **Unit Tests**: Jest with TypeScript for individual components and services
2. **Integration Tests**: Plugin loading and configuration validation
3. **End-to-End Tests**: Playwright for full application workflows
4. **Visual Tests**: Screenshot comparisons for UI consistency

## Test Environment Setup

### Prerequisites
```bash
npm install              # Install dependencies including test frameworks
npm run build           # Build application before testing
```

### Running Tests
```bash
npm test                # Run unit tests
npm run test:e2e        # Run end-to-end tests
npm run test:watch      # Watch mode for development
```

## Documents

### Testing Guides
- **[UI_TESTING.md](./UI_TESTING.md)** - UI component testing strategies
- **[PLUGIN_TESTING.md](./PLUGIN_TESTING.md)** - Plugin-specific testing approaches
- **[UI_COMPONENT_TEST_PLAN.md](./UI_COMPONENT_TEST_PLAN.md)** - Component testing checklist

## Testing Framework Configuration

### Jest Configuration
- **Config**: `jest.config.cjs`
- **Setup**: `tests/setup.ts`
- **Environment**: JSDOM for React components
- **Mocks**: CSS modules automatically mocked

### Playwright Configuration
- **Config**: `playwright.config.ts`
- **Tests**: `tests/e2e/`
- **Browsers**: Chromium, Firefox, WebKit support
- **Screenshots**: Automatic on failure

## Test Categories

### 1. Unit Tests (`tests/core/`, `tests/ui/`)
Test individual components and services in isolation:

```typescript
// Example component test
import { render, screen } from '@testing-library/react';
import Button from '../src/ui/components/Button/Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### 2. Integration Tests
Test plugin loading and configuration:

```typescript
// Example plugin test
import { loadPlugin } from '../src/core/plugin-manager';

test('loads plugin with valid configuration', async () => {
  const plugin = await loadPlugin('test-plugin');
  expect(plugin.isLoaded).toBe(true);
});
```

### 3. End-to-End Tests (`tests/e2e/`)
Test complete user workflows:

```typescript
// Example E2E test
import { test, expect } from '@playwright/test';

test('navigation between pages works', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="plugins-nav"]');
  await expect(page).toHaveURL('/plugins');
});
```

## Testing Best Practices

### Component Testing
- Use React Testing Library for user-centric tests
- Test behavior, not implementation
- Mock external dependencies
- Use semantic queries (getByRole, getByText)

### Plugin Testing
- Test plugin lifecycle (load, init, unload)
- Validate configuration schemas
- Test service registration and communication
- Mock system dependencies

### E2E Testing
- Test critical user journeys
- Use data-testid for reliable element selection
- Keep tests independent and idempotent
- Use page object model for complex flows

## Test Data Management

### Mock Data
- Configuration mocks in `tests/mocks/`
- Component props in test files
- Service responses in `tests/fixtures/`

### Test Utilities
- Custom render functions in `tests/utils/`
- Plugin test helpers
- Configuration builders

## Continuous Integration

### Test Pipeline
1. **Lint**: ESLint and TypeScript checking
2. **Unit**: Jest test suite
3. **Build**: Ensure application builds successfully
4. **E2E**: Playwright test suite
5. **Coverage**: Test coverage reporting

### Coverage Targets
- **Unit Tests**: 80%+ code coverage
- **Integration**: All plugin types covered
- **E2E**: Critical user paths covered

## Common Testing Patterns

### Component Testing
```typescript
// Test component with different props
const renderButton = (props = {}) => 
  render(<Button {...props}>Default Text</Button>);

test('handles click events', () => {
  const onClick = jest.fn();
  renderButton({ onClick });
  fireEvent.click(screen.getByRole('button'));
  expect(onClick).toHaveBeenCalled();
});
```

### Plugin Testing
```typescript
// Test plugin configuration
test('validates plugin configuration', () => {
  const config = { enabled: true, apiKey: 'test' };
  const result = pluginSchema.safeParse(config);
  expect(result.success).toBe(true);
});
```

### Service Testing
```typescript
// Test service functionality
test('service registers and communicates', async () => {
  const service = await registry.getService('test-service');
  const result = await service.performAction();
  expect(result).toBeDefined();
});
```

## Debugging Tests

### Test Failures
- Use `screen.debug()` to inspect rendered output
- Check test isolation and cleanup
- Verify mocks are properly configured
- Use `test.only` to focus on specific tests

### E2E Debugging
- Use `page.pause()` to inspect browser state
- Enable trace viewer for detailed execution
- Check network requests and responses
- Use headed mode for visual debugging

## Support

For testing issues:
1. Check [TROUBLESHOOTING.md](../development/TROUBLESHOOTING.md)
2. Review existing test patterns
3. Use debugging tools and techniques
4. Ensure proper test environment setup