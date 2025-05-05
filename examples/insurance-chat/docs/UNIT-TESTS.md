# Unit Testing Guide for Insurance Chat

This guide covers unit testing approaches for the Insurance Chat components and hooks. These tests focus on verifying individual units of code in isolation.

## Table of Contents

- [Component Testing](#component-testing)
  - [Basic Rendering](#basic-rendering)
  - [User Interactions](#user-interactions)
  - [Error States](#error-states)
  - [Loading States](#loading-states)
- [Hook Testing](#hook-testing)
  - [Basic Functionality](#basic-functionality)
  - [State Management](#state-management)
  - [Error Handling](#error-handling)
  - [Persistence](#persistence)
- [Test Mocking Strategies](#test-mocking-strategies)
  - [Mocking the Hook](#mocking-the-hook)
  - [Mocking the Service](#mocking-the-service)
- [Best Practices](#best-practices)

## Component Testing

Component tests verify that UI components render correctly and respond appropriately to user interactions.

### Basic Rendering

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

### User Interactions

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
  
  test('handles keyboard shortcuts', async () => {
    render(<InsuranceChat />);
    
    // Get input field
    const input = screen.getByPlaceholder(/Ask me anything about insurance/i);
    
    // Type a message
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test message' } });
    });
    
    // Press Enter key
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });
    
    // Verify sendMessage was called
    expect(mockSendMessage).toHaveBeenCalledWith('Test message');
  });
});
```

### Error States

Test how the component handles errors:

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { InsuranceChat } from '~/components/chat/InsuranceChat';

// Mock retryLastMessage function
const mockRetryLastMessage = jest.fn();

// Mock the useInsuranceChat hook with error state
jest.mock('~/lib/hooks/useInsuranceChat', () => ({
  useInsuranceChat: () => ({
    messages: [
      { role: 'user', content: 'Test message', timestamp: new Date().toISOString() }
    ],
    isLoading: false,
    error: new Error('Failed to connect to service'),
    suggestions: [],
    sendMessage: jest.fn(),
    resetChat: jest.fn(),
    retryLastMessage: mockRetryLastMessage,
    searchKnowledgeBase: jest.fn(),
    setModelOverride: jest.fn()
  })
}));

describe('InsuranceChat Error Handling', () => {
  test('displays error message', () => {
    render(<InsuranceChat />);
    
    // Verify error message is displayed
    expect(screen.getByText('Failed to connect to service')).toBeInTheDocument();
    
    // Verify retry button is displayed
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    
    // Click retry button
    act(() => {
      fireEvent.click(retryButton);
    });
    
    // Verify retryLastMessage was called
    expect(mockRetryLastMessage).toHaveBeenCalled();
  });
});
```

### Loading States

Test loading state rendering:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { InsuranceChat } from '~/components/chat/InsuranceChat';

// Mock the useInsuranceChat hook with loading state
jest.mock('~/lib/hooks/useInsuranceChat', () => ({
  useInsuranceChat: () => ({
    messages: [
      { role: 'user', content: 'Test message', timestamp: new Date().toISOString() }
    ],
    isLoading: true,
    error: null,
    suggestions: [],
    sendMessage: jest.fn(),
    resetChat: jest.fn(),
    retryLastMessage: jest.fn(),
    searchKnowledgeBase: jest.fn(),
    setModelOverride: jest.fn()
  })
}));

describe('InsuranceChat Loading State', () => {
  test('displays loading indicator', () => {
    render(<InsuranceChat />);
    
    // Verify loading indicator is displayed
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    
    // Verify input is disabled during loading
    const input = screen.getByPlaceholder(/Ask me anything about insurance/i);
    expect(input).toBeDisabled();
  });
});
```

## Hook Testing

Hook tests verify that custom hooks manage state correctly and implement the desired business logic.

### Basic Functionality

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
});
```

### State Management

Test state management functions like resetting the chat:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';

describe('useInsuranceChat State Management', () => {
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
    expect(result.current.error).toBeNull();
    expect(result.current.suggestions).toEqual([]);
  });
  
  test('retries last message', async () => {
    const { result } = renderHook(() => useInsuranceChat());
    
    // Mock an error state
    await act(async () => {
      await result.current.sendMessage('Test message');
      // Manually set error state
      result.current.error = new Error('Test error');
    });
    
    // Retry last message
    await act(async () => {
      await result.current.retryLastMessage();
    });
    
    // Verify error is cleared and message count is correct
    expect(result.current.error).toBeNull();
    expect(result.current.messages.length).toBe(2);
  });
});
```

### Error Handling

Test how the hook handles errors:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';

// Mock the InsuranceService with error behavior
jest.mock('~/lib/modules/insurance/services/insurance-service', () => {
  return {
    InsuranceService: jest.fn().mockImplementation(() => ({
      processQuery: jest.fn().mockRejectedValue(new Error('Service error')),
      categorizeQuestion: jest.fn().mockResolvedValue('basic'),
      generateFollowUpQuestions: jest.fn().mockReturnValue([])
    }))
  };
});

describe('useInsuranceChat Error Handling', () => {
  test('handles service errors', async () => {
    const { result } = renderHook(() => useInsuranceChat());
    
    // Send a message that will trigger an error
    await act(async () => {
      await result.current.sendMessage('Test message');
    });
    
    // Verify error state
    expect(result.current.error).toBeTruthy();
    expect(result.current.error.message).toBe('Service error');
    expect(result.current.isLoading).toBe(false);
    
    // Verify user message is still in the list
    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('Test message');
  });
});
```

### Persistence

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
        timestamp: new Date().toISOString(),
        id: '1'
      },
      {
        role: 'assistant',
        content: 'Saved response',
        timestamp: new Date().toISOString(),
        id: '2'
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

## Test Mocking Strategies

### Mocking the Hook

For component tests, you'll typically need to mock the `useInsuranceChat` hook:

```typescript
// Basic mock with empty state
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

// Mock with populated messages
jest.mock('~/lib/hooks/useInsuranceChat', () => ({
  useInsuranceChat: () => ({
    messages: [
      { 
        role: 'user', 
        content: 'How does life insurance work?', 
        timestamp: new Date().toISOString(),
        id: '1'
      },
      { 
        role: 'assistant', 
        content: 'Life insurance provides financial protection...', 
        timestamp: new Date().toISOString(),
        id: '2'
      }
    ],
    isLoading: false,
    error: null,
    suggestions: ['How much coverage do I need?', 'What is term life insurance?'],
    sendMessage: jest.fn(),
    resetChat: jest.fn(),
    retryLastMessage: jest.fn(),
    searchKnowledgeBase: jest.fn(),
    setModelOverride: jest.fn()
  })
}));
```

### Mocking the Service

For hook tests, you'll need to mock the `InsuranceService`:

```typescript
// Basic mock with successful responses
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

// Mock with query-dependent responses
jest.mock('~/lib/modules/insurance/services/insurance-service', () => {
  return {
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
      categorizeQuestion: jest.fn((query) => {
        if (query.includes('coverage') || query.includes('premium')) {
          return Promise.resolve('policy');
        } else if (query.includes('health') || query.includes('medical')) {
          return Promise.resolve('health');
        } else {
          return Promise.resolve('basic');
        }
      }),
      generateFollowUpQuestions: jest.fn().mockReturnValue([
        'How much coverage would you need?',
        'Are you interested in term or permanent insurance?'
      ])
    }))
  };
});

// Mock with error responses
jest.mock('~/lib/modules/insurance/services/insurance-service', () => {
  return {
    InsuranceService: jest.fn().mockImplementation(() => ({
      processQuery: jest.fn().mockRejectedValue(new Error('Service error')),
      categorizeQuestion: jest.fn().mockResolvedValue('basic'),
      generateFollowUpQuestions: jest.fn().mockReturnValue([])
    }))
  };
});
```

## Best Practices

1. **Keep tests focused**
   - Test one behavior per test
   - Use descriptive test names
   - Group related tests with `describe` blocks

2. **Isolate tests**
   - Reset mocks between tests
   - Clean up state (localStorage, etc.)
   - Avoid shared state between tests

3. **Mock external dependencies**
   - Mock API calls
   - Mock localStorage
   - Mock timers for predictable testing

4. **Test error cases**
   - Test error handling
   - Test edge cases
   - Test boundary conditions

5. **Ensure test coverage**
   - Cover all component variations
   - Test all hook methods
   - Verify state transitions

By following these practices, you'll create a robust test suite that verifies your Insurance Chat components and hooks work correctly and reliably.
