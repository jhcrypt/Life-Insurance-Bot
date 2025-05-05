# Insurance Chat Testing Guide

This guide provides comprehensive examples and best practices for testing your Insurance Chat implementations, from basic unit tests to complex integration tests with AI providers.

## Table of Contents

- [Quick Start Guide](#quick-start-guide)
- [Testing Overview](#testing-overview)
- [Unit Tests](#unit-tests)
  - [Component Tests](#component-tests)
  - [Hook Tests](#hook-tests)
- [Integration Tests](#integration-tests)
  - [Service Integration](#service-integration)
  - [Multi-provider Tests](#multi-provider-tests)
- [Test Mocking Strategies](#test-mocking-strategies)
- [Performance Testing](#performance-testing)
  - [Response Time Tests](#response-time-tests)
  - [Memory Usage](#memory-usage)
  - [Stress Testing](#stress-testing)
- [CI/CD Configuration](#cicd-configuration)
  - [GitHub Actions Workflow](#github-actions-workflow)
  - [Test Environment Configuration](#test-environment-configuration)
  - [CI Best Practices](#ci-best-practices)
- [Troubleshooting](#troubleshooting)
  - [API-Related Issues](#api-related-issues)
  - [Test Reliability Issues](#test-reliability-issues)
  - [Resource and Performance Issues](#resource-and-performance-issues)
  - [Debugging Techniques](#debugging-techniques)
- [Test Checklists](#test-checklists)
- [Additional Resources](#additional-resources)
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

See the full documentation below for detailed information and advanced testing scenarios.

---

## Testing Overview
The Insurance Chat components can be tested at several levels:

1. **Component Tests**: Verify UI rendering and interactions
2. **Hook Tests**: Verify state management and business logic
3. **Integration Tests**: Verify integration with AI services
4. **End-to-End Tests**: Verify full user flows

This guide focuses on the first three types, which cover most testing needs.

## Unit Tests

### Component Tests

#### Basic Rendering

Test that the Insurance Chat component renders correctly with default props:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { InsuranceChat } from '~/components/chat/InsuranceChat';

// Mock the useInsuranceChat hook
jest.mock('~/lib/hooks/useInsuranceChat', () => ({
  useInsuranceChat: () => ({
    messages: [],
    isLoading: false,
    error: null,
    suggestions: [],
    sendMessage: jest.fn(),
    resetChat: jest.fn(),
    retryLastMessage: jest.fn(),
    searchKnowledgeBase: jest.fn(),
    setModelOverride: jest.fn()
  })
}));

describe('InsuranceChat Component', () => {
  test('renders with default props', () => {
    render(<InsuranceChat />);
    
    // Verify that key elements are rendered
    expect(screen.getByPlaceholder(/Ask me anything about insurance/i)).toBeInTheDocument();
    expect(screen.getByText(/Basic Insurance Info/i)).toBeInTheDocument();
  });
});
```

#### User Interactions

Test that user interactions like typing, sending messages, and clicking suggestions work:

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { InsuranceChat } from '~/components/chat/InsuranceChat';

// Mock the useInsuranceChat hook with controlled behavior
const mockSendMessage = jest.fn();
jest.mock('~/lib/hooks/useInsuranceChat', () => ({
  useInsuranceChat: () => ({
    messages: [],
    isLoading: false,
    error: null,
    suggestions: ['How much coverage do I need?'],
    sendMessage: mockSendMessage,
    resetChat: jest.fn(),
    retryLastMessage: jest.fn(),
    searchKnowledgeBase: jest.fn(),
    setModelOverride: jest.fn()
  })
}));

describe('InsuranceChat Interactions', () => {
  test('allows typing and sending messages', async () => {
    render(<InsuranceChat />);
    
    // Get input field and send button
    const input = screen.getByPlaceholder(/Ask me anything about insurance/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Type a message
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test message' } });
    });
    
    // Verify input value changed
    expect(input).toHaveValue('Test message');
    
    // Click send button
    await act(async () => {
      fireEvent.click(sendButton);
    });
    
    // Verify sendMessage was called with the message
    expect(mockSendMessage).toHaveBeenCalledWith('Test message');
  });
  
  test('handles clicking suggestions', async () => {
    render(<InsuranceChat />);
    
    // Find and click a suggestion
    const suggestion = screen.getByText('How much coverage do I need?');
    
    await act(async () => {
      fireEvent.click(suggestion);
    });
    
    // Verify sendMessage was called with the suggestion text
    expect(mockSendMessage).toHaveBeenCalledWith('How much coverage do I need?');
  });
});
```

#### Error States

Test how the component handles errors:

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { InsuranceChat } from '~/components/chat/InsuranceChat';

// Mock the useInsuranceChat hook with error state
jest.mock('~/lib/hooks/useInsuranceChat', () => ({
  useInsuranceChat: () => ({
    messages: [],
    isLoading: false,
    error: new Error('Failed to connect to service'),
    suggestions: [],
    sendMessage: jest.fn(),
    resetChat: jest.fn(),
    retryLastMessage: jest.fn(),
    searchKnowledgeBase: jest.fn(),
    setModelOverride: jest.fn()
  })
}));

describe('InsuranceChat Error Handling', () => {
  test('displays error message', () => {
    render(<InsuranceChat />);
    
    // Verify error message is displayed
    expect(screen.getByText('Failed to connect to service')).toBeInTheDocument();
  });
});
```

### Hook Tests

#### Basic Functionality

Test the `useInsuranceChat` hook's basic functionality:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';

// Mock the InsuranceService
jest.mock('~/lib/modules/insurance/services/insurance-service', () => {
  return {
    InsuranceService: jest.fn().mockImplementation(() => ({
      processQuery: jest.fn().mockResolvedValue('This is a mock response'),
      categorizeQuestion: jest.fn().mockResolvedValue('basic'),
      generateFollowUpQuestions: jest.fn().mockReturnValue([
        'Follow-up question 1', 
        'Follow-up question 2'
      ])
    }))
  };
});

describe('useInsuranceChat Hook', () => {
  test('initializes with empty state', () => {
    const { result } = renderHook(() => useInsuranceChat());
    
    // Verify initial state
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.suggestions).toEqual([]);
  });
  
  test('sends message and updates state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useInsuranceChat());
    
    // Send a message
    await act(async () => {
      await result.current.sendMessage('Test message');
    });
    
    // Verify state updates
    expect(result.current.messages.length).toBe(2); // User message + response
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('Test message');
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].content).toBe('This is a mock response');
    expect(result.current.suggestions).toEqual(['Follow-up question 1', 'Follow-up question 2']);
  });
  
  test('resets chat state', async () => {
    const { result } = renderHook(() => useInsuranceChat());
    
    // Send a message first
    await act(async () => {
      await result.current.sendMessage('Test message');
    });
    
    // Verify we have messages
    expect(result.current.messages.length).toBe(2);
    
    // Reset the chat
    await act(async () => {
      result.current.resetChat();
    });
    
    // Verify state is reset
    expect(result.current.messages).toEqual([]);
  });
});
```

#### Persistence

Test that chat persistence works correctly:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useInsuranceChat Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });
  
  test('persists messages to localStorage', async () => {
    const { result } = renderHook(() => useInsuranceChat({ persistMessages: true }));
    
    // Send a message
    await act(async () => {
      await result.current.sendMessage('Test message');
    });
    
    // Verify localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalled();
    
    // Verify the format of saved data
    const key = localStorageMock.setItem.mock.calls[0][0];
    const value = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    
    expect(key).toBe('insurance-chat-history');
    expect(Array.isArray(value)).toBe(true);
    expect(value.length).toBe(2);
    expect(value[0].role).toBe('user');
    expect(value[0].content).toBe('Test message');
  });
  
  test('loads messages from localStorage', () => {
    // Set up localStorage with messages
    const savedMessages = [
      {
        role: 'user',
        content: 'Saved message',
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant',
        content: 'Saved response',
        timestamp: new Date().toISOString()
      }
    ];
    
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedMessages));
    
    // Initialize hook
    const { result } = renderHook(() => useInsuranceChat({ persistMessages: true }));
    
    // Verify messages were loaded
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[0].content).toBe('Saved message');
    expect(result.current.messages[1].content).toBe('Saved response');
  });
});
```

## Integration Tests

### Service Integration

Test integration with the actual InsuranceService:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';

// Skip tests if no API keys are available
const hasApiKeys = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
const testOrSkip = hasApiKeys ? test : test.skip;

describe('useInsuranceChat Service Integration', () => {
  // Set longer timeout for real service calls
  jest.setTimeout(30000);
  
  testOrSkip('integrates with real AI service', async () => {
    const { result } = renderHook(() => useInsuranceChat({
      config: {
        // Use a fast model for testing
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 100
      }
    }));
    
    // Send a simple query that should work with most models
    await act(async () => {
      await result.current.sendMessage('What is term life insurance?');
    });
    
    // Verify response
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[1].role).toBe('assistant');
    
    // The actual response content will vary, but should mention term life
    expect(result.current.messages[1].content.toLowerCase()).toContain('term');
    expect(result.current.messages[1].content.toLowerCase()).toContain('insurance');
    
    // Should have suggestions
    expect(result.current.suggestions.length).toBeGreaterThan(0);
  });
  
  testOrSkip('maintains context between messages', async () => {
    const { result } = renderHook(() => useInsuranceChat());
    
    // First message with age and coverage
    await act(async () => {
      await result.current.sendMessage('I am 40 years old and need $500,000 in coverage');
    });
    
    // Second message referring to the first
    await act(async () => {
      await result.current.sendMessage('What type of policy would be best for me?');
    });
    
    // The response should reference the age and coverage
    const response = result.current.messages[3].content;
    
    // Should mention either age or coverage in the context
    const hasContext = 
      response.includes('40') || 
      response.includes('500') || 
      response.includes('age') || 
      response.includes('coverage');
      
    expect(hasContext).toBe(true);
  });
});
```

### Multi-provider Tests

Test switching between providers:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import MultiProviderChat from '../multi-provider';

// Skip if no API keys available
const hasApiKeys = process.env.OPENAI_API_KEY && process.env.ANTHROPIC_API_KEY;
const testOrSkip = hasApiKeys ? test : test.skip;

describe('MultiProviderChat Integration', () => {
  // Increase timeout for real API calls
  jest.setTimeout(30000);
  
  testOrSkip('can switch between providers', async () => {
    render(<MultiProviderChat />);
    
    // Test with first provider (OpenAI)
    const input = screen.getByPlaceholder(/Ask.*insurance/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Send a message with default provider
    await act(async () => {
      fireEvent.change(input, { target: { value: 'What is term life insurance?' } });
      fireEvent.click(sendButton);
    });
    
    // Wait for first response
    const firstResponse = await waitFor(() => {
      return screen.getByText(/term life insurance/i);
    }, { timeout: 10000 });
    
    // Now switch provider
    const providerSelect = screen.getByLabelText(/AI Provider/i);
    
    await act(async () => {
      fireEvent.change(providerSelect, { target: { value: 'Anthropic' } });
    });
    
    // Send same message with new provider
    await act(async () => {
      fireEvent.change(input, { target: { value: 'What is term life insurance?' } });
      fireEvent.click(sendButton);
    });
    
    // Wait for second response
    const secondResponse = await waitFor(() => {
      const responses = screen.getAllByText(/term life insurance/i);
      return responses.find(el => el !== firstResponse);
    }, { timeout: 10000 });
    
    // Verify we got different responses
    expect(firstResponse.textContent).not.toBe(secondResponse.textContent);
  });
  
  testOrSkip('handles provider errors gracefully', async () => {
    // Mock the InsuranceService to fail for a specific provider
    jest.mock('~/lib/modules/insurance/services/insurance-service', () => {
      const originalModule = jest.requireActual('~/lib/modules/insurance/services/insurance-service');
      
      return {
        ...originalModule,
        InsuranceService: jest.fn().mockImplementation((config) => {
          if (config.provider === 'broken') {
            return {
              processQuery: jest.fn().mockRejectedValue(new Error('Provider unavailable')),
              categorizeQuestion: jest.fn().mockResolvedValue('basic'),
              generateFollowUpQuestions: jest.fn().mockReturnValue([])
            };
          } else {
            return new originalModule.InsuranceService(config);
          }
        })
      };
    });
    
    render(<MultiProviderChat />);
    
    // Switch to the broken provider
    const providerSelect = screen.getByLabelText(/AI Provider/i);
    
    await act(async () => {
      fireEvent.change(providerSelect, { target: { value: 'broken' } });
    });
    
    // Try to send a message
    const input = screen.getByPlaceholder(/Ask.*insurance/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
    });
    
    // Should display error and retry button
    await waitFor(() => {
      expect(screen.getByText(/Provider unavailable/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
    
    // Switch to a working provider and retry
    await act(async () => {
      fireEvent.change(providerSelect, { target: { value: 'OpenAI' } });
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    });
    
    // Should now get a successful response
    await waitFor(() => {
      expect(screen.queryByText(/Provider unavailable/i)).not.toBeInTheDocument();
      expect(screen.getByText(/assistant/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  });
});

## Test Mocking Strategies

Effective mocking is essential for reliable tests. Here are strategies for mocking different components of the Insurance Chat system.

### Mocking the AI Service

```typescript
// Mock the InsuranceService for consistent responses
jest.mock('~/lib/modules/insurance/services/insurance-service', () => ({
  InsuranceService: jest.fn().mockImplementation(() => ({
    processQuery: jest.fn((query) => {
      if (query.includes('term life')) {
        return Promise.resolve('Term life insurance provides coverage for a specific period...');
      } else if (query.includes('whole life')) {
        return Promise.resolve('Whole life insurance is a permanent policy...');
      } else {
        return Promise.resolve('I can help answer your insurance questions.');
      }
    }),
    categorizeQuestion: jest.fn().mockResolvedValue('basic'),
    generateFollowUpQuestions: jest.fn().mockReturnValue([
      'How much coverage would you need?',
      'Are you interested in term or permanent insurance?'
    ])
  }))
}));
```

### Creating Test Fixtures

```typescript
// Create reusable test data
const createTestMessages = (count = 5) => {
  const messages = [];
  for (let i = 0; i < count; i++) {
    messages.push({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Test message ${i}`,
      timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
      id: `msg-${i}`
    });
  }
  return messages;
};

// Mock localStorage for persistence tests
const mockLocalStorage = () => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; })
  };
};

// Setup for a test
test('loads chat history', () => {
  // Setup mock localStorage
  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage() });
  
  // Use test fixture
  const testMessages = createTestMessages(10);
  localStorage.setItem('insurance-chat-history', JSON.stringify(testMessages));
  
  const { result } = renderHook(() => useInsuranceChat({ persistMessages: true }));
  
  expect(result.current.messages.length).toBe(10);
});
```

## Performance Testing

### Response Time Tests

Test the time it takes to get responses:

```typescript
import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';

describe('Insurance Chat Performance', () => {
  // Skip if no API keys available
  const hasApiKeys = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  const testOrSkip = hasApiKeys ? test : test.skip;
  
  // Set longer timeout for performance tests
  jest.setTimeout(30000);
  
  testOrSkip('responds within acceptable time limits', async () => {
    const { result } = renderHook(() => useInsuranceChat({
      config: {
        model: 'gpt-3.5-turbo', // Use faster model for testing
        maxTokens: 100
      }
    }));
    
    const startTime = Date.now();
    
    await act(async () => {
      await result.current.sendMessage('What is term life insurance?');
    });
    
    const responseTime = Date.now() - startTime;
    
    // Response should come within 5 seconds
    expect(responseTime).toBeLessThan(5000);
  });
  
  testOrSkip('maintains performance with chat history', async () => {
    const { result } = renderHook(() => useInsuranceChat());
    
    // Send 5 messages and measure response times
    const responseTimesMs = [];
    
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      
      await act(async () => {
        await result.current.sendMessage(`Test question ${i} about life insurance`);
      });
      
      responseTimesMs.push(Date.now() - startTime);
    }
    
    // Calculate average response time
    const avgResponseTime = responseTimesMs.reduce((sum, time) => sum + time, 0) / responseTimesMs.length;
    
    console.log(`Average response time: ${avgResponseTime}ms`);
    
    // Later messages shouldn't be significantly slower than earlier ones
    const firstHalf = responseTimesMs.slice(0, 2);
    const secondHalf = responseTimesMs.slice(3);
    
    const avgFirstHalf = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
    const avgSecondHalf = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;
    
    // Second half shouldn't be more than 50% slower than first half
    // This test might be flaky depending on network conditions
    expect(avgSecondHalf).toBeLessThan(avgFirstHalf * 1.5);
  });
});
```

### Memory Usage

Test memory usage patterns:

```typescript
import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';

// These tests rely on Node.js memory measurement
// They may not be suitable for browser environments
describe('Memory Usage', () => {
  test('keeps memory usage reasonable', async () => {
    // Get initial memory usage
    const initialMemory = process.memoryUsage().heapUsed;
    
    const { result } = renderHook(() => useInsuranceChat({
      persistMessages: true // Enable persistence to test storage impact
    }));
    
    // Send 20 messages
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        await result.current.sendMessage(`Test message ${i}`);
      });
    }
    
    // Get final memory usage
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    console.log(`Memory increase: ${memoryIncrease / (1024 * 1024)} MB`);
    
    // Memory increase should be less than 50MB
    // This is a rough heuristic and may need adjustment
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
  
  test('properly cleans up resources after unmount', async () => {
    const { result, unmount } = renderHook(() => useInsuranceChat());
    
    // Send a few messages
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await result.current.sendMessage(`Test message ${i}`);
      });
    }
    
    // Unmount the component
    unmount();
    
    // Force garbage collection if possible
    if (global.gc) {
      global.gc();
    }
    
    // Verify resources are cleaned up (simplified check)
    expect(true).toBe(true); // In real tests, check specific resources
  });
});
```

### Stress Testing

Test how the system handles heavy load:

```typescript
import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';

describe('Stress Testing', () => {
  // Skip these in normal CI runs to save time and resources
  // Run manually when needed
  test.skip('handles rapid message sequences', async () => {
    const { result } = renderHook(() => useInsuranceChat());
    
    // Send multiple messages in rapid succession
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        act(async () => {
          await result.current.sendMessage(`Quick message ${i}`);
        })
      );
    }
    
    // Wait for all to complete
    await Promise.all(promises);
    
    // Should have processed all messages
    expect(result.current.messages.length).toBe(10); // 5 user + 5 assistant
  });
  
  test.skip('handles long conversations without degradation', async () => {
    const { result } = renderHook(() => useInsuranceChat());
    
    // Initial response time benchmark
    const startTime1 = Date.now();
    await act(async () => {
      await result.current.sendMessage('What is term life insurance?');
    });
    const initialResponseTime = Date.now() - startTime1;
    
    // Send 30 messages to build up context
    for (let i = 0; i < 30; i++) {
      await act(async () => {
        await result.current.sendMessage(`Message ${i} about insurance policies`);
      });
    }
    
    // Final response time after context is large
    const startTime2 = Date.now();
    await act(async () => {
      await result.current.sendMessage('What is term life insurance?');
    });
    const finalResponseTime = Date.now() - startTime2;
    
    // Final shouldn't be more than 3x slower than initial
    expect(finalResponseTime).toBeLessThan(initialResponseTime * 3);
  });
});
```

## Test Data

1. **Creating Test Fixtures**

```typescript
// Create reusable test data
const createTestMessages = (count = 5) => {
  const messages = [];
  for (let i = 0; i < count; i++) {
    messages.push({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Test message ${i}`,
      timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
      id: `msg-${i}`
    });
  }
  return messages;
};

test('loads chat history', () => {
  // Use test fixture
  const testMessages = createTestMessages(10);
  localStorage.setItem('insurance-chat-history', JSON.stringify(testMessages));
  
  const { result } = renderHook(() => useInsuranceChat({ persistMessages: true }));
  
  expect(result.current.messages.length).toBe(10);
});
```

2. **Mocking API Responses**

```typescript
// Create realistic but deterministic API responses
const mockInsuranceResponses = {
  'term life': 'Term life insurance provides coverage for a specific period (term), typically 10-30 years. It pays a death benefit if you die during the term.',
  'whole life': 'Whole life insurance is permanent coverage that lasts your entire life. It includes a cash value component that grows over time.',
  'universal life': 'Universal life insurance is a flexible permanent policy that allows you to adjust premiums and death benefits over time.',
  default: 'That\'s a great question about insurance. Let me provide you with some information.'
};

// Mock the service with realistic responses
jest.mock('~/lib/modules/insurance/services/insurance-service', () => ({
  InsuranceService: jest.fn().mockImplementation(() => ({
    processQuery: jest.fn((query) => {
      // Select response based on query content
      for (const [key, response] of Object.entries(mockInsuranceResponses)) {
        if (query.toLowerCase().includes(key)) {
          return Promise.resolve(response);
        }
      }
      return Promise.resolve(mockInsuranceResponses.default);
    }),
    categorizeQuestion: jest.fn().mockResolvedValue('basic'),
    generateFollowUpQuestions: jest.fn().mockReturnValue([
      'How much coverage would you need?',
      'Are you interested in term or permanent insurance?'
    ])
  }))
}));
```

### Debugging Test Failures

1. **Verbose Logging**

```typescript
// Set up verbose logging for tests
beforeAll(() => {
  // Only in test environment
  if (process.env.NODE_ENV === 'test') {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation((...args) => {
      if (process.env.DEBUG) {
        // eslint-disable-next-line no-console
        console.info('[DEBUG]', ...args);
      }
    });
  }
});

test('debug difficult test', async () => {
  console.debug('Starting test');
  const { result } = renderHook(() => useInsuranceChat());
  
  console.debug('Sending message');
  await act(async () => {
    await result.current.sendMessage('Test message');
  });
  
  console.debug('Message state:', result.current.messages);
  expect(result.current.messages.length).toBe(2);
});
```

2. **Element Debugging**

```typescript
// Debug render issues
test('debug render problems', async () => {
  const { debug, getByText } = render(<InsuranceChat />);
  
  // Log the entire rendered component
  debug();
  
  // Try to find element
  try {
    const element = getByText('Missing Element');
  } catch (error) {
    console.log('Elements in document:');
    Array.from(document.querySelectorAll('*'))
      .filter(el => el.textContent && el.textContent.trim().length > 0)
      .forEach(el => {
        console.log(`${el.tagName}: "${el.textContent.trim().slice(0, 50)}"`);
      });
    throw error;
  }
});
```

## CI/CD Configuration

### GitHub Actions Workflow

```yaml
name: Insurance Chat Tests

on:
  push:
    paths:
      - 'app/components/chat/**'
      - 'app/lib/modules/insurance/**'
      - 'examples/insurance-chat/**'
  pull_request:
    paths:
      - 'app/components/chat/**'
      - 'app/lib/modules/insurance/**'
      - 'examples/insurance-chat/**'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm test -- --testPathPattern="insurance-chat" --testPathIgnorePatterns="integration|performance"
  
  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    if: ${{ github.event_name == 'push' || contains(github.event.pull_request.labels.*.name, 'run-integration') }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run integration tests
        if: ${{ secrets.TEST_OPENAI_API_KEY != '' }}
        env:
          OPENAI_API_KEY: ${{ secrets.TEST_OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.TEST_ANTHROPIC_API_KEY }}
        run: npm test -- --testPathPattern="insurance-chat/integration"
  
  performance-tests:
    runs-on: ubuntu-latest
    if: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
    needs: integration-tests
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run performance tests
        env:
          OPENAI_API_KEY: ${{ secrets.TEST_OPENAI_API_KEY }}
          NODE_OPTIONS: '--max-old-space-size=4096'
        run: npm test -- --testPathPattern="insurance-chat/performance"
```

### CI Optimization Techniques

#### Test Matrix and Parallelization

```yaml
jobs:
  test-matrix:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-group: [unit, integration, performance]
    
    steps:
      # Setup steps...
      
      - name: Run tests
        run: npm test -- --testPathPattern="${{ matrix.test-group }}"
```

#### Dependency Caching

```yaml
steps:
  - uses: actions/checkout@v3
  
  - name: Setup Node.js
    uses: actions/setup-node@v3
    with:
      node-version: '18'
      cache: 'npm'
  
  # This cache speeds up testing by caching Jest's cache
  - name: Cache Jest
    uses: actions/cache@v3
    with:
      path: .jest-cache
      key: ${{ runner.os }}-jest-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
        ${{ runner.os }}-jest-
        
  - name: Run tests with cache
    run: npm test -- --cache-directory=.jest-cache
```

#### Test Reports

```yaml
- name: Run tests with JUnit report
  run: npm test -- --ci --reporters=default --reporters=jest-junit
  
- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: test-results
    path: junit.xml
```

### Test Environment Configuration

1. **Environment Variables**
```bash
# Required for integration tests
OPENAI_API_KEY=your_test_key_here
ANTHROPIC_API_KEY=your_test_key_here

# Optional: Configure test behavior
DEBUG=true
TEST_TIMEOUT=30000
SKIP_PERFORMANCE_TESTS=true
```

2. **Jest Configuration**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
  testPathIgnorePatterns: [
    '/node_modules/',
    process.env.SKIP_PERFORMANCE_TESTS ? 'performance' : ''
  ]
};
```

### Test Scripts

Add these scripts to your package.json:

```json
{
  "scripts": {
    "test:unit": "jest --testPathPattern='insurance-chat' --testPathIgnorePatterns='integration|performance'",
    "test:integration": "jest --testPathPattern='insurance-chat/integration'",
    "test:performance": "jest --testPathPattern='insurance-chat/performance'",
    "test:ci": "npm run test:unit && npm run test:integration"
  }
}
```

### CI Best Practices

1. **Test Organization**
   - Separate unit, integration, and performance tests
   - Run faster tests first
   - Skip resource-intensive tests in PR builds

2. **Environment Management**
   - Use test-specific API keys
   - Set appropriate timeouts
   - Configure memory limits for performance tests

3. **Performance Considerations**
   - Cache dependencies
   - Run performance tests only on main branch
   - Use test splitting for large test suites

4. **Security**
   - Never expose real API keys
   - Use secret management for sensitive data
   - Validate incoming PR tests

### Skip Tests in CI

```typescript
// Skip expensive tests in CI
const isCI = process.env.CI === 'true';
const testOrSkip = isCI ? test.skip : test;

testOrSkip('expensive integration test', async () => {
  // Resource-intensive test that should not run in CI
});
```

## Troubleshooting

### Common Issues

#### API-Related Problems

1. **API Key Configuration**

```typescript
// Check if API keys are available before running tests
beforeAll(() => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('Skipping API tests: No OpenAI API key available');
  }
});

// Use conditional testing
const testOrSkip = process.env.OPENAI_API_KEY ? test : test.skip;

testOrSkip('makes API call with valid key', async () => {
  // Test that requires real API key
});
```

2. **API Rate Limits**

```typescript
// Add delays between API calls to avoid rate limits
beforeEach(async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
});

// Implement exponential backoff for retries
const apiCallWithRetry = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 || error.message.includes('rate limit')) {
        const delay = Math.pow(2, i) * 1000;
        console.log(`Rate limited, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
};
```

3. **Timeout Issues**

```typescript
// Increase timeout for API-dependent tests
jest.setTimeout(30000); // 30 seconds

// Or use per-test timeout
test('long-running API call', async () => {
  // Test implementation
}, 30000); // Timeout in ms

// Increase timeout for specific waitFor calls
await waitFor(() => {
  expect(screen.getByText(/response/i)).toBeInTheDocument();
}, { timeout: 10000 });
```

#### Test Reliability Issues

1. **Flaky Test Detection**

```typescript
// Test retry function for flaky tests
const retryTest = async (testFn, attempts = 3) => {
  let lastError;
  
  for (let i = 0; i < attempts; i++) {
    try {
      await testFn();
      return; // Test passed
    } catch (error) {
      console.warn(`Test attempt ${i+1} failed: ${error.message}`);
      lastError = error;
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error(`Test failed after ${attempts} attempts. Last error: ${lastError}`);
};

test('potentially flaky test', async () => {
  await retryTest(async () => {
    // Test implementation
  });
});
```

2. **Async Timing Issues**

```typescript
// Use proper async/await patterns
test('handles async operations', async () => {
  const { result } = renderHook(() => useInsuranceChat());
  
  // Always wrap async actions in act
  await act(async () => {
    await result.current.sendMessage('Test');
  });
  
  // Wait for all updates to complete
  await waitFor(() => {
    expect(result.current.messages.length).toBe(2);
  });
});
```

3. **Non-Deterministic AI Responses**

```typescript
// Use partial matching instead of exact text matching
test('AI gives appropriate response', async () => {
  const { result } = renderHook(() => useInsuranceChat());
  
  await act(async () => {
    await result.current.sendMessage('What is term life insurance?');
  });
  
  // Check for key concepts rather than exact wording
  await waitFor(() => {
    const response = result.current.messages[1].content.toLowerCase();
    expect(response).toContain('term');
    expect(response).toContain('insurance');
    // Check for any of these concepts
    const hasRelevantConcepts = 
      response.includes('period') ||
      response.includes('years') ||
      response.includes('death benefit');
    expect(hasRelevantConcepts).toBe(true);
  });
});
```

#### Resource and Performance Issues

1. **Memory Usage Monitoring**

```typescript
// Function to get memory usage in MB
const getMemoryUsageMB = () => {
  const used = process.memoryUsage();
  return Math.round(used.heapUsed / 1024 / 1024);
};

test('memory usage stays reasonable', async () => {
  const initialMemory = getMemoryUsageMB();
  
  const { result } = renderHook(() => useInsuranceChat());
  
  // Send multiple messages
  for (let i = 0; i < 10; i++) {
    await act(async () => {
      await result.current.sendMessage(`Test message ${i}`);
    });
  }
  
  const finalMemory = getMemoryUsageMB();
  const memoryIncrease = finalMemory - initialMemory;
  
  console.log(`Memory usage increased by ${memoryIncrease}MB`);
  expect(memoryIncrease).toBeLessThan(50); // 50MB limit
});
```

2. **Performance Degradation**

```typescript
// Track response time degradation
test('performance stays consistent', async () => {
  const { result } = renderHook(() => useInsuranceChat());
  const responseTimes = [];
  
  // Send 5 messages and track times
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    
    await act(async () => {
      await result.current.sendMessage(`Test question ${i}`);
    });
    
    responseTimes.push(Date.now() - start);
  }
  
  // Log all response times
  console.log('Response times (ms):', responseTimes);
  
  // Verify performance doesn't degrade more than 50%
  const firstResponse = responseTimes[0];
  const lastResponse = responseTimes[responseTimes.length - 1];
  
  expect(lastResponse).toBeLessThan(firstResponse * 1.5);
});
```

3. **Resource Cleanup**

```typescript
// Ensure tests clean up resources
let subscription;

beforeEach(() => {
  // Set up event listener or subscription
  subscription = someEventEmitter.on('event', () => {});
});

afterEach(() => {
  // Clean up resources
  if (subscription) {
    subscription.unsubscribe();
  }
  
  // Reset mocks
  jest.clearAllMocks();
  
  // Clear storages
  localStorage.clear();
  sessionStorage.clear();
});
```

### Debugging Techniques

1. **Enhanced Logging**

```typescript
// Create a debug logger
const createDebugLogger = (prefix) => {
  return (...args) => {
    if (process.env.DEBUG === 'true') {
      console.log(`[${prefix}]`, ...args);
    }
  };
};

// Use in tests
test('debugging with custom logger', async () => {
  const debug = createDebugLogger('TEST');
  
  debug('Starting test');
  const { result } = renderHook(() => useInsuranceChat());
  
  debug('Sending message');
  await act(async () => {
    await result.current.sendMessage('Test message');
  });
  
  debug('Messages:', result.current.messages);
  expect(result.current.messages.length).toBe(2);
});
```

2. **Component Visualization**

```typescript
// Debug component rendering
test('debug render issues', () => {
  const { debug, container } = render(<InsuranceChat />);
  
  // Log entire component tree
  debug();
  
  // Log specific element
  console.log('Input element:', prettyDOM(container.querySelector('input')));
  
  // Try finding all buttons
  const buttons = container.querySelectorAll('button');
  console.log(`Found ${buttons.length} buttons:`);
  buttons.forEach(button => {
    console.log(`- ${button.textContent || button.getAttribute('aria-label')}`);
  });
});
```

3. **Mock Inspection**

```typescript
// Track mock calls
test('debug mock behavior', async () => {
  // Create mock
  const mockProcessQuery = jest.fn().mockResolvedValue('Test response');
  
  // Use mock
  jest.mock('~/lib/modules/insurance/services/insurance-service', () => ({
    InsuranceService: jest.fn().mockImplementation(() => ({
      processQuery: mockProcessQuery,
      // Other methods...
    }))
  }));
  
  // Test implementation
  const { result } = renderHook(() => useInsuranceChat());
  
  await act(async () => {
    await result.current.sendMessage('Test message');
  });
  
  // Inspect mock calls
  console.log('Mock called times:', mockProcessQuery.mock.calls.length);
  console.log('Call arguments:', mockProcessQuery.mock.calls[0]);
  console.log('Return values:', mockProcessQuery.mock.results[0].value);
  
  expect(mockProcessQuery).toHaveBeenCalledWith(
    expect.stringContaining('Test message')
  );
});
```

### Quick Reference

#### Testing Component Checklist

- [ ] UI rendering tests
- [ ] User interaction tests
- [ ] Error state tests
- [ ] Loading state tests
- [ ] Accessibility tests

#### Testing Hook Checklist

- [ ] Initial state tests
- [ ] State update tests
- [ ] Error handling tests
- [ ] Persistence tests
- [ ] Cleanup tests

#### Testing Service Checklist

- [ ] API integration tests
- [ ] Error handling tests
- [ ] Rate limiting tests
- [ ] Response format tests

### Additional Resources

1. **Documentation**
   - [Jest Documentation](https://jestjs.io/docs/getting-started)
   - [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
   - [Testing React Hooks](https://react-hooks-testing-library.com/)

2. **Tools**
   - [Jest Test Explorer](https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner)
   - [React Testing Library Cheatsheet](https://testing-library.com/docs/dom-testing-library/cheatsheet)
   - [Jest Snapshot Testing](https://jestjs.io/docs/snapshot-testing)

3. **Best Practices**
   - Use small, focused tests
   - Test behavior, not implementation
   - Make tests deterministic when possible
   - Use descriptive test names
   - Follow the AAA pattern (Arrange, Act, Assert)

## Summary

This testing guide provides a comprehensive approach to testing the Insurance Chat module, from basic unit tests to integration with AI providers. By following these testing strategies, you can:

1. **Ensure reliability** - Verify functionality works across different scenarios
2. **Maintain quality** - Catch regressions before they reach production
3. **Document behavior** - Tests serve as living documentation of expected behavior
4. **Support refactoring** - Confidently improve code with test coverage

Start with the unit tests outlined in this guide, then add integration tests as your implementation matures. Use the troubleshooting section to address common issues, and implement the CI/CD configuration to ensure continuous test coverage.

Happy testing!
