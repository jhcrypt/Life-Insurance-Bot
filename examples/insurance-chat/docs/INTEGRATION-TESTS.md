# Integration Testing Guide for Insurance Chat

This guide covers integration testing for the Insurance Chat, focusing on testing interactions with AI services and ensuring proper integration between components.

## Table of Contents

- [Overview](#overview)
- [AI Service Integration](#ai-service-integration)
- [Multi-Provider Testing](#multi-provider-testing)
- [Performance Testing](#performance-testing)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

Integration tests verify that different parts of the Insurance Chat system work together correctly:

- Component-to-Hook integration
- Hook-to-Service integration
- Service-to-AI Provider integration
- Cross-provider functionality

Unlike unit tests, integration tests interact with actual services or realistic mocks of those services, focusing on the interactions between components rather than isolated functionality.

## AI Service Integration

### Basic Service Tests

Test basic integration with AI services:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';

// Skip tests if no API keys available
const hasApiKeys = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
const testOrSkip = hasApiKeys ? test : test.skip;

describe('Insurance Chat Service Integration', () => {
  // Set longer timeout for real service calls
  jest.setTimeout(30000);
  
  testOrSkip('integrates with AI service', async () => {
    const { result } = renderHook(() => useInsuranceChat({
      config: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 100
      }
    }));
    
    await act(async () => {
      await result.current.sendMessage('What is term life insurance?');
    });
    
    // Verify response
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[1].content.toLowerCase()).toContain('term');
    expect(result.current.messages[1].content.toLowerCase()).toContain('insurance');
  });
  
  testOrSkip('maintains context between messages', async () => {
    const { result } = renderHook(() => useInsuranceChat());
    
    // First message with context
    await act(async () => {
      await result.current.sendMessage('I am 35 years old and need $500,000 in coverage');
    });
    
    // Follow-up without restating context
    await act(async () => {
      await result.current.sendMessage('What type of policy would be best for me?');
    });
    
    // Response should reference age and coverage in some way
    const response = result.current.messages[3].content.toLowerCase();
    const hasContext = 
      response.includes('35') || 
      response.includes('age') || 
      response.includes('500,000') || 
      response.includes('coverage');
      
    expect(hasContext).toBe(true);
  });
});
```

### Testing Knowledge Base Integration

Test that the knowledge base is integrated with responses:

```typescript
describe('Knowledge Base Integration', () => {
  testOrSkip('enhances responses with knowledge base', async () => {
    // Create service with custom knowledge base
    const knowledgeBase = [
      {
        question: 'What is ABC Insurance\'s term life policy?',
        answer: 'ABC Insurance offers term life policies with coverage from $50,000 to $5 million, with terms of 10, 20, or 30 years.'
      }
    ];
    
    const { result } = renderHook(() => useInsuranceChat({
      config: {
        model: 'gpt-3.5-turbo',
        knowledgeBase
      }
    }));
    
    await act(async () => {
      await result.current.sendMessage('Tell me about ABC Insurance\'s term life policy');
    });
    
    // Response should include knowledge base information
    const response = result.current.messages[1].content.toLowerCase();
    expect(response).toContain('abc insurance');
    expect(response).toMatch(/(\$50,000|\$5 million|10, 20, or 30 years)/);
  });
  
  testOrSkip('searches knowledge base directly', async () => {
    const { result } = renderHook(() => useInsuranceChat({
      config: {
        knowledgeBase: [
          {
            question: 'What are the health requirements?',
            answer: 'Our policy requires a basic health questionnaire for coverage under $500,000 and a medical exam for higher amounts.'
          }
        ]
      }
    }));
    
    // Test direct knowledge base search
    await act(async () => {
      await result.current.searchKnowledgeBase('health requirements');
    });
    
    // Should provide knowledge base match as a suggestion
    expect(result.current.suggestions.length).toBeGreaterThan(0);
    expect(result.current.suggestions[0]).toContain('health questionnaire');
  });
});
```

## Multi-Provider Testing

Test switching between different AI providers:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import MultiProviderChat from '../multi-provider';

describe('Multi-Provider Integration', () => {
  testOrSkip('switches between providers', async () => {
    render(<MultiProviderChat />);
    
    // Get input and provider select
    const input = screen.getByPlaceholder(/Ask.*insurance/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    const providerSelect = screen.getByLabelText(/AI Provider/i);
    
    // Test OpenAI response
    await act(async () => {
      fireEvent.change(input, { target: { value: 'What is term life insurance?' } });
      fireEvent.click(sendButton);
    });
    
    const openAIResponse = await screen.findByText(/term life insurance/i, {}, { timeout: 10000 });
    
    // Switch to Anthropic
    await act(async () => {
      fireEvent.change(providerSelect, { target: { value: 'Anthropic' } });
    });
    
    // Test Anthropic response
    await act(async () => {
      fireEvent.change(input, { target: { value: 'What is term life insurance?' } });
      fireEvent.click(sendButton);
    });
    
    const anthropicResponse = await screen.findByText(/term life insurance/i, {}, { timeout: 10000 });
    
    // Responses should be different
    expect(anthropicResponse.textContent).not.toBe(openAIResponse.textContent);
  });
  
  testOrSkip('preserves conversation context across providers', async () => {
    render(<MultiProviderChat />);
    
    const input = screen.getByPlaceholder(/Ask.*insurance/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    const providerSelect = screen.getByLabelText(/AI Provider/i);
    
    // Set context with first provider
    await act(async () => {
      fireEvent.change(input, { target: { value: 'I am 40 years old with two children' } });
      fireEvent.click(sendButton);
    });
    
    await screen.findByText(/40|years old|children/i, {}, { timeout: 10000 });
    
    // Switch provider and ask follow-up
    await act(async () => {
      fireEvent.change(providerSelect, { target: { value: 'Anthropic' } });
      fireEvent.change(input, { target: { value: 'What life insurance do you recommend for me?' } });
      fireEvent.click(sendButton);
    });
    
    // New provider should have context from previous conversation
    const response = await screen.findByText(/40|years old|children/i, {}, { timeout: 10000 });
    expect(response).toBeTruthy();
  });
});
```

### Provider Error Handling

Test how the application handles provider errors:

```typescript
describe('Provider Error Handling', () => {
  test('handles provider errors gracefully', async () => {
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
    const errorMessage = await screen.findByText(/Provider unavailable/i);
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(errorMessage).toBeInTheDocument();
    expect(retryButton).toBeInTheDocument();
    
    // Switch to a working provider and retry
    await act(async () => {
      fireEvent.change(providerSelect, { target: { value: 'OpenAI' } });
      fireEvent.click(retryButton);
    });
    
    // Should now get a successful response
    const successfulResponse = await screen.findByText(/assistant/i, {}, { timeout: 10000 });
    expect(successfulResponse).toBeInTheDocument();
  });
});
```

## Performance Testing

### Response Time Tests

```typescript
describe('Response Time Testing', () => {
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
    console.log(`Response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(5000); // 5 second limit
  });
  
  testOrSkip('maintains performance with chat history', async () => {
    const { result } = renderHook(() => useInsuranceChat());
    
    // Send 5 messages and measure response times
    const responseTimesMs = [];
    
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      
      await act(async () => {
        await result.current.sendMessage(`Question ${i} about life insurance`);
      });
      
      responseTimesMs.push(Date.now() - startTime);
    }
    
    // Later messages shouldn't be significantly slower than earlier ones
    const firstHalf = responseTimesMs.slice(0, 2);
    const secondHalf = responseTimesMs.slice(3);
    
    const avgFirstHalf = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
    const avgSecondHalf = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;
    
    // Performance should not degrade more than 50%
    expect(avgSecondHalf).toBeLessThan(avgFirstHalf * 1.5);
  });
});
```

### Concurrent Request Handling

```typescript
describe('Concurrent Request Handling', () => {
  testOrSkip('handles multiple requests efficiently', async () => {
    const { result } = renderHook(() => useInsuranceChat());
    
    const messages = [
      'What is term life insurance?',
      'What is whole life insurance?',
      'How much coverage do I need?'
    ];
    
    const startTime = Date.now();
    
    // Send all messages concurrently
    await Promise.all(
      messages.map(msg => 
        act(async () => {
          await result.current.sendMessage(msg);
        })
      )
    );
    
    const totalTime = Date.now() - startTime;
    
    // All messages should be processed
    expect(result.current.messages.length).toBe(messages.length * 2);
    
    // Total time should be reasonable (less than processing them serially)
    // This test may be flaky depending on API rate limits
    console.log(`Total time for ${messages.length} concurrent requests: ${totalTime}ms`);
    expect(totalTime).toBeLessThan(messages.length * 5000); // Should be faster than serial processing
  });
});
```

## Error Handling

Test error scenarios and recovery:

```typescript
describe('Error Handling Integration', () => {
  testOrSkip('handles API errors gracefully', async () => {
    const { result } = renderHook(() => useInsuranceChat({
      config: {
        model: 'invalid-model', // Invalid model to trigger error
        temperature: 0.7
      }
    }));
    
    await act(async () => {
      await result.current.sendMessage('Test message');
    });
    
    expect(result.current.error).toBeTruthy();
    expect(result.current.isLoading).toBe(false);
    
    // User message should still be in the messages list
    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].content).toBe('Test message');
  });
  
  testOrSkip('recovers from API errors with retry', async () => {
    const { result } = renderHook(() => useInsuranceChat({
      config: {
        model: 'invalid-model' // Start with invalid model
      }
    }));
    
    // Send message that will fail
    await act(async () => {
      await result.current.sendMessage('Test message');
    });
    
    expect(result.current.error).toBeTruthy();
    
    // Update config to valid model
    await act(async () => {
      result.current.setModelOverride('gpt-3.5-turbo');
    });
    
    // Retry the message
    await act(async () => {
      await result.current.retryLastMessage();
    });
    
    // Should now succeed
    expect(result.current.error).toBeNull();
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[1].role).toBe('assistant');
  });
  
  testOrSkip('handles rate limiting', async () => {
    const { result } = renderHook(() => useInsuranceChat());
    
    // Send multiple messages rapidly to trigger rate limits
    const messages = Array(5).fill('What is term life insurance?');
    
    // Try to send all messages quickly
    const results = await Promise.allSettled(
      messages.map(msg => 
        act(async () => {
          await result.current.sendMessage(msg);
        })
      )
    );
    
    // Some requests might fail due to rate limiting
    const failures = results.filter(r => r.status === 'rejected');
    const successes = results.filter(r => r.status === 'fulfilled');
    
    console.log(`Rate limit test: ${successes.length} succeeded, ${failures.length} failed`);
    
    // Should still have some successful responses
    expect(successes.length).toBeGreaterThan(0);
    
    // Wait for rate limit to reset
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Should be able to send messages again
    await act(async () => {
      await result.current.sendMessage('Test after rate limit');
    });
    
    expect(result.current.error).toBeNull();
    expect(result.current.messages[result.current.messages.length - 1].role).toBe('assistant');
  });
  
  testOrSkip('implements exponential backoff for retries', async () => {
    // Mock service that fails with rate limit errors a few times then succeeds
    let attempts = 0;
    jest.mock('~/lib/modules/insurance/services/insurance-service', () => {
      return {
        InsuranceService: jest.fn().mockImplementation(() => ({
          processQuery: jest.fn().mockImplementation(() => {
            if (attempts < 3) {
              attempts++;
              const error = new Error('Rate limit exceeded');
              error.status = 429;
              return Promise.reject(error);
            }
            return Promise.resolve('This is a response after retry');
          }),
          categorizeQuestion: jest.fn().mockResolvedValue('basic'),
          generateFollowUpQuestions: jest.fn().mockReturnValue([])
        }))
      };
    });
    
    const { result } = renderHook(() => useInsuranceChat({
      config: {
        enableRetries: true,
        maxRetries: 4
      }
    }));
    
    const startTime = Date.now();
    
    // Send a message that will initially fail with rate limit errors
    await act(async () => {
      await result.current.sendMessage('Test message with retries');
    });
    
    const totalTime = Date.now() - startTime;
    
    // Should have successful response after retries
    expect(result.current.error).toBeNull();
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[1].content).toBe('This is a response after retry');
    
    // Should have taken some time due to exponential backoff
    expect(totalTime).toBeGreaterThan(1000); // Should take at least 1 second with backoff
    console.log(`Retry with backoff took ${totalTime}ms`);
    
    // Verify correct number of attempts
    expect(attempts).toBe(3);
  });
});
```

## Best Practices

### 1. API Key Management

- **Use test-specific API keys**
  ```typescript
  // Configure test keys from environment
  const testConfig = {
    openAIKey: process.env.TEST_OPENAI_API_KEY,
    anthropicKey: process.env.TEST_ANTHROPIC_API_KEY
  };
  ```

- **Never commit API keys to version control**
  ```gitignore
  # .gitignore
  .env
  .env.test
  .env.local
  ```

- **Set up proper key rotation for test environments**
  ```typescript
  // Check key expiration in tests
  beforeAll(() => {
    if (process.env.TEST_KEY_EXPIRY && new Date(process.env.TEST_KEY_EXPIRY) < new Date()) {
      console.warn('⚠️ Test API keys may have expired! Check rotation schedule.');
    }
  });
  ```

### 2. Test Reliability

- **Add retries for flaky tests**
  ```typescript
  const retryTest = async (testFn, maxRetries = 3) => {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        await testFn();
        return; // Success!
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        console.log(`Test failed, retrying (${attempt + 1}/${maxRetries})`);
        attempt++;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  };
  ```

- **Use appropriate timeouts**
  ```typescript
  // Set longer timeouts for API-dependent tests
  jest.setTimeout(30000); // 30 seconds
  
  // Increase timeout for specific waitFor calls
  const response = await screen.findByText(/insurance/i, {}, { timeout: 10000 });
  ```

- **Handle rate limiting gracefully**
  ```typescript
  const sendWithRateLimitHandling = async (message) => {
    try {
      return await api.sendMessage(message);
    } catch (error) {
      if (error.status === 429) {
        await new Promise(r => setTimeout(r, 2000));
        return await api.sendMessage(message);
      }
      throw error;
    }
  };
  ```

### 3. Performance Testing

- **Monitor response times**
  ```typescript
  const startTime = performance.now();
  await result.current.sendMessage('Test message');
  console.log(`Response time: ${performance.now() - startTime}ms`);
  ```

- **Log performance metrics**
  ```typescript
  // Test with different token limits
  const tokenLimits = [100, 500, 1000];
  const times = [];
  
  for (const limit of tokenLimits) {
    const start = Date.now();
    await result.current.sendMessage('Test', { maxTokens: limit });
    times.push({ limit, time: Date.now() - start });
  }
  
  console.table(times);
  ```

### 4. Error Scenarios

- **Test various error types**
  ```typescript
  // Authentication errors
  testOrSkip('handles invalid API keys', async () => {
    const { result } = renderHook(() => useInsuranceChat({
      config: { openAIKey: 'invalid-key' }
    }));
    
    await act(async () => {
      await result.current.sendMessage('Test');
    });
    
    expect(result.current.error.message).toContain('authentication');
  });
  
  // Network errors
  testOrSkip('handles network failures', async () => {
    // Mock fetch to simulate network failure
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useInsuranceChat());
    
    await act(async () => {
      await result.current.sendMessage('Test');
    });
    
    expect(result.current.error.message).toContain('Network error');
  });
  ```

## Summary

Integration testing for the Insurance Chat system requires careful consideration of:

1. **Real Service Interaction**
   - Testing with actual AI providers
   - Handling API responses
   - Managing rate limits
   - Error recovery

2. **Cross-Component Integration**
   - Component-to-Hook communication
   - Hook-to-Service interaction
   - Service-to-Provider integration
   - Knowledge base integration

3. **Performance and Reliability**
   - Response time monitoring
   - Load testing
   - Error handling
   - Resource management

By thoroughly testing the integration points of your Insurance Chat implementation, you can ensure it performs reliably in real-world situations, properly integrates with AI providers, and gracefully handles error conditions and edge cases.

Use the test patterns and best practices described in this guide to build a comprehensive test suite that covers the full range of integration scenarios for your Insurance Chat implementation.
