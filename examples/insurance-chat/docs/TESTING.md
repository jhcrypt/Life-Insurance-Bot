# Insurance Chat Testing Guide

This guide provides an overview of testing approaches for the Insurance Chat component. For detailed guidance on specific testing areas, see the specialized documentation files.

## Table of Contents

- [Quick Start Guide](#quick-start-guide)
- [Testing Overview](#testing-overview)
- [Specialized Testing Documentation](#specialized-testing-documentation)
- [Test Organization](#test-organization)
- [Summary](#summary)

## Quick Start Guide

Get started with testing the Insurance Chat implementation:

### 1. Basic Setup
```bash
# Install dependencies
npm install

# Set up environment variables for API access
cp .env.example .env
# Edit .env to add your API keys
```

### 2. Running Tests
```bash
# Run all tests
npm test -- --testPathPattern="insurance-chat"

# Run specific test types
npm test -- --testPathPattern="insurance-chat/unit"         # Unit tests only
npm test -- --testPathPattern="insurance-chat/integration"  # Integration tests
npm test -- --testPathPattern="insurance-chat/performance"  # Performance tests

# Run tests in watch mode during development
npm test -- --testPathPattern="insurance-chat" --watch
```

### 3. Common Test Examples

#### Component Test
```typescript
import { render, screen } from '@testing-library/react';
import { InsuranceChat } from '~/components/chat/InsuranceChat';

test('renders chat interface', () => {
  render(<InsuranceChat />);
  expect(screen.getByPlaceholder(/Ask.*insurance/i)).toBeInTheDocument();
});
```

#### Hook Test
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';

test('sends message', async () => {
  const { result } = renderHook(() => useInsuranceChat());
  await act(async () => {
    await result.current.sendMessage('Test message');
  });
  expect(result.current.messages.length).toBe(2);
});
```

#### Mock AI Service
```typescript
// Mock InsuranceService for deterministic responses
jest.mock('~/lib/modules/insurance/services/insurance-service', () => ({
  InsuranceService: jest.fn().mockImplementation(() => ({
    processQuery: jest.fn().mockResolvedValue('Mock response about insurance'),
    categorizeQuestion: jest.fn().mockResolvedValue('basic'),
    generateFollowUpQuestions: jest.fn().mockReturnValue(['Follow-up question'])
  }))
}));
```

### 4. Key Files to Test
- `app/components/chat/InsuranceChat.tsx` - Main chat component
- `app/lib/hooks/useInsuranceChat.ts` - Chat state management hook
- `app/lib/modules/insurance/services/insurance-service.ts` - AI service

### 5. Debugging Tips
- Set `DEBUG=true` for verbose logging
- Use `test.only()` to run specific tests
- Check for API key issues if integration tests fail
- Use `console.log` inside tests (outputs appear in terminal)
- For component debugging, use `screen.debug()` to see rendered HTML

## Testing Overview

The Insurance Chat components can be tested at several levels:

1. **Component Tests**: Verify UI rendering and interactions
2. **Hook Tests**: Verify state management and business logic
3. **Integration Tests**: Verify integration with AI services
4. **End-to-End Tests**: Verify full user flows

This documentation is organized into specialized sections to help you focus on specific testing needs.

## Specialized Testing Documentation

This documentation is split into multiple focused files:

1. **[UNIT-TESTS.md](./UNIT-TESTS.md)** - Detailed guidance on component and hook testing
2. **[INTEGRATION-TESTS.md](./INTEGRATION-TESTS.md)** - Instructions for testing with AI services and multi-provider testing
3. **[CI-CD.md](./CI-CD.md)** - CI/CD configuration, workflows, and best practices
4. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues, debugging techniques, and solutions

Each file provides in-depth coverage of its specific topic to help you implement comprehensive testing for the Insurance Chat module.

## Test Organization

For best results, organize your tests in a logical structure that mirrors your source code:

```
/app
  /components
    /chat
      InsuranceChat.tsx
      InsurancePrompts.tsx
      __tests__
        InsuranceChat.test.tsx
        InsurancePrompts.test.tsx
  /lib
    /hooks
      useInsuranceChat.ts
      __tests__
        useInsuranceChat.test.ts
    /modules
      /insurance
        /services
          insurance-service.ts
          __tests__
            insurance-service.test.ts
/test
  /integration
    insurance-chat.integration.test.ts
  /performance
    insurance-chat.performance.test.ts
```

## Summary

This testing guide provides a comprehensive approach to testing the Insurance Chat module. By following these testing strategies, you can:

1. **Ensure reliability** - Verify functionality works across different scenarios
2. **Maintain quality** - Catch regressions before they reach production
3. **Document behavior** - Tests serve as living documentation of expected behavior
4. **Support refactoring** - Confidently improve code with test coverage

Start with the unit tests outlined in the [UNIT-TESTS.md](./UNIT-TESTS.md) file, then add integration tests as your implementation matures. Use the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) file to address common issues, and implement the CI/CD configuration from [CI-CD.md](./CI-CD.md) to ensure continuous test coverage.

Happy testing!

