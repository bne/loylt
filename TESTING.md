# Test Documentation

## Overview
Comprehensive test suite for the loylt loyalty stamp card application.

## Test Structure

### Unit Tests
- **Location**: `src/tests/`
- **Files**:
  - `utils.test.ts` - Token generation and authentication utilities
  - `db-queries.test.ts` - Database query functions
  - `components/StampGrid.test.ts` - StampGrid component

### Integration Tests
- **Location**: `src/tests/integration/`
- **Files**:
  - `database.test.ts` - Database integration tests (requires test DB)
  - `user-flows.test.ts` - Customer and admin user flows

### API Tests
- **Location**: `src/tests/`
- **Files**:
  - `api-routes.test.ts` - API endpoint tests

### E2E Tests
- **Location**: `src/tests/`
- **Files**:
  - `e2e.test.ts` - End-to-end validation tests

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test src/tests/utils.test.ts
```

## Test Coverage

The test suite covers:
- ✅ Token generation and validation
- ✅ Password hashing and verification
- ✅ Database queries (CRUD operations)
- ✅ API endpoints (all routes)
- ✅ Component rendering
- ✅ User authentication flows
- ✅ Customer stamp collection flows
- ✅ Analytics calculations
- ✅ QR code generation logic

## Integration Tests

Integration tests require a test database. To run integration tests:

1. Create test database:
   ```bash
   createdb loylt_test
   ```

2. Set environment variable:
   ```bash
   export TEST_DATABASE_URL=postgresql://loylt:loylt_dev@localhost:5432/loylt_test
   ```

3. Run integration tests:
   ```bash
   npm test src/tests/integration/
   ```

## Mocking Strategy

- **Database**: Uses vi.mock to mock database connections in unit tests
- **API Routes**: Mocks request/response objects
- **Components**: Uses @testing-library/svelte for component testing
- **Browser APIs**: Mocks localStorage, sessionStorage, crypto, fetch

## Test Data

Tests use:
- Predictable UUIDs for consistency
- Mock passwords and hashes
- Sample establishment and transaction data
- LocalStorage/SessionStorage simulation

## Best Practices

1. **Isolation**: Each test is independent and doesn't affect others
2. **Cleanup**: Tests clean up after themselves (beforeEach/afterEach)
3. **Mocking**: External dependencies are mocked appropriately
4. **Coverage**: Aim for >80% code coverage
5. **Readability**: Tests are descriptive and easy to understand

## Adding New Tests

When adding new features:

1. Write unit tests for utilities and functions
2. Write component tests for UI components
3. Write API tests for new endpoints
4. Write integration tests for user flows
5. Update this documentation

## Common Test Patterns

### Testing API Endpoints
```typescript
const mockRequest = {
  json: vi.fn().mockResolvedValue({ data: 'test' })
};
const response = await POST({ request: mockRequest as any });
expect(response.status).toBe(200);
```

### Testing Components
```typescript
const { container } = render(Component, {
  props: { prop: 'value' }
});
expect(container.querySelector('.class')).toBeTruthy();
```

### Testing Database Queries
```typescript
vi.mocked(query).mockResolvedValueOnce([mockData]);
const result = await queryFunction('id');
expect(result).toEqual(mockData);
```

## Continuous Integration

Tests should be run:
- Before committing code
- In CI/CD pipeline
- Before deployment
- After major refactoring

## Troubleshooting

### Tests failing locally
- Ensure dependencies are installed: `npm install`
- Check environment variables are set
- Verify test database is running (for integration tests)

### Mock issues
- Clear mocks between tests with `vi.clearAllMocks()`
- Ensure mocks are set up before importing modules

### Coverage issues
- Run `npm run test:coverage` to see detailed report
- Focus on testing critical paths and business logic
