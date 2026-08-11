# Testing Guide

This document outlines the testing setup, instructions, and best practices for the Chat Widget application.

## Setup

The project uses the following testing tools:

- **Vitest**: A Vite-native testing framework
- **React Testing Library**: For testing React components
- **Jest DOM**: For DOM-specific assertions
- **User Event**: For simulating user interactions

### Available Scripts

```bash
# Run tests in watch mode
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests with visual UI
npm run test:ui
```

## Writing Tests

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<YourComponent />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked!')).toBeInTheDocument();
  });
});
```

### Testing Hooks

```typescript
import { renderHook, act } from "@testing-library/react";
import { useYourHook } from "./useYourHook";

describe("useYourHook", () => {
  it("updates state correctly", () => {
    const { result } = renderHook(() => useYourHook());
    act(() => {
      result.current.updateState();
    });
    expect(result.current.value).toBe(expectedValue);
  });
});
```

### Testing Error Boundaries

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { ThrowError } from './ThrowError';

describe('ErrorBoundary', () => {
  it('renders fallback UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Test Behavior, Not Implementation**

   - Focus on what the user sees and interacts with
   - Avoid testing implementation details
   - Use semantic queries over test IDs

2. **Use Semantic Queries**

   ```typescript
   // Good
   screen.getByRole("button", { name: "Submit" });
   screen.getByLabelText("Username");

   // Avoid
   screen.getByTestId("submit-button");
   ```

3. **Test User Interactions**

   - Use `userEvent` over `fireEvent`
   - Test the complete user flow
   - Consider accessibility in your tests

4. **Keep Tests Focused**

   - One assertion per test when possible
   - Clear test descriptions
   - Isolate tests from each other

5. **Mocking**
   - Mock external dependencies
   - Use MSW for API mocking
   - Keep mocks simple and maintainable

## File Organization

- Place test files next to the components they test
- Use `.test.tsx` or `.spec.tsx` extension
- Create a `__tests__` directory for shared test utilities

## Common Patterns

### Testing Async Code

```typescript
it('handles async operations', async () => {
  render(<AsyncComponent />);
  await screen.findByText('Loaded!');
  expect(screen.getByText('Data')).toBeInTheDocument();
});
```

### Testing Context

```typescript
it('works with context', () => {
  render(
    <YourContext.Provider value={mockValue}>
      <YourComponent />
    </YourContext.Provider>
  );
  expect(screen.getByText('Context Value')).toBeInTheDocument();
});
```

### Testing Custom Hooks

```typescript
it("custom hook works", () => {
  const { result } = renderHook(() => useCustomHook());
  act(() => {
    result.current.increment();
  });
  expect(result.current.count).toBe(1);
});
```

## Coverage

Run coverage reports to identify untested code:

```bash
npm run test:coverage
```

Aim for:

- 80%+ line coverage
- 100% coverage of critical paths
- Focus on business logic coverage over UI elements

## Troubleshooting

Common issues and solutions:

1. **Async Test Failures**

   - Use `findBy` instead of `getBy` for async elements
   - Ensure proper `async/await` usage
   - Check for proper cleanup

2. **Context/Provider Issues**

   - Wrap components with necessary providers
   - Mock context values appropriately
   - Use `renderHook` for testing hooks

3. **Timing Issues**
   - Use `waitFor` for async operations
   - Consider using `act` for state updates
   - Be mindful of animation timings

## Test Folder Structure

We follow a structured approach to organizing tests that promotes maintainability and clarity:

```
src/
├── __tests__/                    # Shared test utilities and setup
│   ├── setup.ts                  # Global test setup
│   ├── mocks/                    # Shared mock data and functions
│   │   ├── api.ts               # API mocks
│   │   └── store.ts             # Store mocks
│   └── utils/                    # Test utilities
│       ├── render.ts            # Custom render functions
│       └── test-utils.ts        # Common test helpers
│
├── components/                   # React components
│   ├── ComponentName/
│   │   ├── ComponentName.tsx    # Component implementation
│   │   ├── ComponentName.test.tsx  # Component tests
│   │   └── __snapshots__/       # Jest snapshots (if used)
│   └── ...
│
├── hooks/                       # Custom hooks
│   ├── useHookName.ts          # Hook implementation
│   └── useHookName.test.ts     # Hook tests
│
├── store/                       # State management
│   ├── store.ts                # Store implementation
│   └── store.test.ts           # Store tests
│
└── utils/                       # Utility functions
    ├── utilName.ts             # Utility implementation
    └── utilName.test.ts        # Utility tests
```

### Key Principles

1. **Co-location**

   - Keep test files next to the code they test
   - Makes it easier to find and maintain related code
   - Helps with code navigation

2. **Shared Test Utilities**

   - Place common test utilities in `__tests__/utils`
   - Create custom render functions for common provider setups
   - Share mock data and functions

3. **Test Organization**

   - Group related tests using `describe` blocks
   - Use clear, descriptive test names
   - Follow the pattern: `describe('ComponentName', () => { ... })`

4. **Mock Organization**
   - Keep mocks in a dedicated `__tests__/mocks` directory
   - Create separate files for different types of mocks
   - Use consistent naming conventions

### Example Structure in Practice

```typescript
// src/__tests__/utils/render.ts
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const customRender = (ui: React.ReactElement, options = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
    options
  );
};

export * from '@testing-library/react';
export { customRender as render };

// src/components/ChatWidget/ChatWidget.test.tsx
import { render, screen } from '@/__tests__/utils/render';
import { ChatWidget } from './ChatWidget';

describe('ChatWidget', () => {
  it('renders correctly', () => {
    render(<ChatWidget />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

// src/hooks/useChat/useChat.test.ts
import { renderHook, act } from '@testing-library/react';
import { useChat } from './useChat';

describe('useChat', () => {
  it('initializes with correct state', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
  });
});
```

### Best Practices for Test Organization

1. **File Naming**

   - Use `.test.tsx` for component tests
   - Use `.test.ts` for non-component tests
   - Consider `.spec.tsx` for integration tests

2. **Test Structure**

   ```typescript
   describe("ComponentName", () => {
     // Setup
     beforeEach(() => {
       // Common setup
     });

     // Happy path tests
     describe("when successful", () => {
       it("should render correctly", () => {
         // Test implementation
       });
     });

     // Error cases
     describe("when error occurs", () => {
       it("should handle error gracefully", () => {
         // Test implementation
       });
     });
   });
   ```

3. **Mock Organization**

   ```typescript
   // src/__tests__/mocks/api.ts
   export const mockApiResponse = {
     // Mock data
   };

   // src/__tests__/mocks/store.ts
   export const mockStore = {
     // Mock store state
   };
   ```

4. **Test Utilities**
   ```typescript
   // src/__tests__/utils/test-utils.ts
   export const createMockUser = (overrides = {}) => ({
     id: "1",
     name: "Test User",
     ...overrides,
   });
   ```

This structure helps maintain:

- Clear separation of concerns
- Easy navigation and maintenance
- Reusable test utilities
- Consistent testing patterns
- Scalable test organization
