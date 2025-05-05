# Quick Reference Guide for Insurance Chat

This guide provides quick solutions for common tasks when working with the Insurance Chat module.

## Contents

- [Component Usage](#component-usage)
- [Hook Integration](#hook-integration)
- [API Configuration](#api-configuration) 
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Common Issues](#common-issues)

## Component Usage

### Basic Implementation

```jsx
import { InsuranceChat } from '~/components/chat/InsuranceChat';

function MyApp() {
  return <InsuranceChat />;
}
```

### With Custom Configuration

```jsx
import { InsuranceChat } from '~/components/chat/InsuranceChat';

function MyApp() {
  return (
    <InsuranceChat 
      config={{
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 200
      }}
      initialPrompt="Welcome to our insurance assistant!"
      customPrompts={[
        { text: "What insurance plans do you offer?", category: "basic" },
        { text: "How much coverage do I need?", category: "policy" }
      ]}
    />
  );
}
```

### With Event Handlers

```jsx
import { InsuranceChat } from '~/components/chat/InsuranceChat';

function MyApp() {
  const handleSend = (message) => {
    console.log('User sent:', message);
  };
  
  const handleResponseReceived = (response) => {
    console.log('AI response:', response);
  };
  
  const handleError = (error) => {
    console.error('Chat error:', error);
  };
  
  return (
    <InsuranceChat 
      onSend={handleSend}
      onResponseReceived={handleResponseReceived}
      onError={handleError}
    />
  );
}
```

## Hook Integration

### Basic Usage

```jsx
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';

function CustomChatUI() {
  const {
    messages,
    isLoading,
    error,
    suggestions,
    sendMessage,
    resetChat,
    retryLastMessage
  } = useInsuranceChat();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const message = e.target.message.value;
    sendMessage(message);
    e.target.reset();
  };
  
  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && <div className="loading">Thinking...</div>}
        {error && <div className="error">{error.message}</div>}
      </div>
      
      <form onSubmit={handleSubmit}>
        <input name="message" placeholder="Ask about insurance..." />
        <button type="submit">Send</button>
      </form>
      
      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((suggestion, i) => (
            <button key={i} onClick={() => sendMessage(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### With Persistence

```jsx
const { messages } = useInsuranceChat({
  persistMessages: true,
  storageKey: 'my-insurance-chat-history'
});
```

### With Custom Configuration

```jsx
const chat = useInsuranceChat({
  config: {
    model: 'gpt-3.5-turbo',
    temperature: 0.5,
    maxTokens: 150,
    knowledgeBase: [
      {
        question: 'What is your coverage limit?',
        answer: 'Our standard policies offer coverage up to $1 million.'
      }
    ]
  }
});
```

## API Configuration

### Setting Up API Keys

In your `.env` file:

```
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

In your code:

```jsx
const config = {
  provider: 'openai', // or 'anthropic'
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-3.5-turbo'
};

const chat = useInsuranceChat({ config });
```

### Switching Between Providers

```jsx
function MultiProviderChat() {
  const [provider, setProvider] = useState('openai');
  
  const chat = useInsuranceChat({
    config: {
      provider,
      apiKey: provider === 'openai' 
        ? process.env.OPENAI_API_KEY 
        : process.env.ANTHROPIC_API_KEY,
      model: provider === 'openai' ? 'gpt-4' : 'claude-2'
    }
  });
  
  return (
    <div>
      <select 
        value={provider} 
        onChange={(e) => setProvider(e.target.value)}
      >
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
      </select>
      
      {/* Chat UI implementation */}
    </div>
  );
}
```

### Handling Rate Limits

```javascript
const sendWithRetry = async (message, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await api.sendMessage(message);
    } catch (error) {
      if (error.status === 429) {
        // Wait with exponential backoff
        const delay = Math.pow(2, i) * 1000;
        console.log(`Rate limited, retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};
```

## Testing

### Running Tests

```bash
# Run all insurance chat tests
npm test -- --testPathPattern="insurance-chat"

# Run only unit tests
npm test -- --testPathPattern="insurance-chat" --testPathIgnorePatterns="integration|performance"

# Run integration tests
npm test -- --testPathPattern="insurance-chat/integration"

# Run tests in watch mode
npm test -- --testPathPattern="insurance-chat" --watch
```

### Component Test Example

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { InsuranceChat } from '~/components/chat/InsuranceChat';

test('sends message when form is submitted', () => {
  // Mock the hook
  jest.mock('~/lib/hooks/useInsuranceChat', () => ({
    useInsuranceChat: () => ({
      messages: [],
      isLoading: false,
      error: null,
      suggestions: [],
      sendMessage: jest.fn(),
      resetChat: jest.fn()
    })
  }));
  
  render(<InsuranceChat />);
  
  // Find input and button
  const input = screen.getByPlaceholderText(/Ask.*insurance/i);
  const button = screen.getByRole('button', { name: /send/i });
  
  // Type and submit
  fireEvent.change(input, { target: { value: 'Test message' } });
  fireEvent.click(button);
  
  // Verify sendMessage was called
  expect(require('~/lib/hooks/useInsuranceChat').useInsuranceChat().sendMessage)
    .toHaveBeenCalledWith('Test message');
});
```

### Hook Test Example

```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';

// Mock the service
jest.mock('~/lib/modules/insurance/services/insurance-service', () => ({
  InsuranceService: jest.fn().mockImplementation(() => ({
    processQuery: jest.fn().mockResolvedValue('Mock response'),
    categorizeQuestion: jest.fn().mockResolvedValue('basic'),
    generateFollowUpQuestions: jest.fn().mockReturnValue(['Question 1', 'Question 2'])
  }))
}));

test('sends message and updates state', async () => {
  const { result } = renderHook(() => useInsuranceChat());
  
  await act(async () => {
    await result.current.sendMessage('Hello');
  });
  
  expect(result.current.messages).toHaveLength(2);
  expect(result.current.messages[0]).toEqual(expect.objectContaining({
    role: 'user',
    content: 'Hello'
  }));
  expect(result.current.messages[1]).toEqual(expect.objectContaining({
    role: 'assistant',
    content: 'Mock response'
  }));
});
```

## Debugging

### Enable Debug Logging

```javascript
// In development environment
localStorage.setItem('debug', 'true');

// In Node.js environment
process.env.DEBUG = 'true';

// Usage
const debug = process.env.DEBUG === 'true' || localStorage.getItem('debug') === 'true';
if (debug) {
  console.log('Debug info:', someData);
}
```

### Component Debugging

```jsx
function DebugPanel({ data }) {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        fontSize: '12px',
        maxHeight: '200px',
        overflow: 'auto',
        zIndex: 9999
      }}
    >
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

// Usage
function ChatWithDebug() {
  const chat = useInsuranceChat();
  
  return (
    <>
      <InsuranceChat />
      <DebugPanel data={chat} />
    </>
  );
}
```

### Network Request Debugging

```javascript
// Add this in development
const originalFetch = window.fetch;
window.fetch = async function(input, init) {
  const url = typeof input === 'string' ? input : input.url;
  console.group(`Fetch: ${init?.method || 'GET'} ${url}`);
  console.log('Request:', { url, init });
  
  try {
    const response = await originalFetch.apply(this, [input, init]);
    console.log('Response status:', response.status);
    console.groupEnd();
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    console.groupEnd();
    throw error;
  }
};
```

## Performance Optimization

### Limit Message History

```javascript
const useMessageHistory = (maxMessages = 50) => {
  const [messages, setMessages] = useState([]);
  
  const addMessage = useCallback((message) => {
    setMessages(current => {
      const updated = [...current, message];
      // Trim if too long
      return updated.length > maxMessages 
        ? updated.slice(-maxMessages) 
        : updated;
    });
  }, [maxMessages]);
  
  return { messages, addMessage };
};
```

### Memoize Components

```jsx
// Prevent unnecessary re-renders
const Message = React.memo(({ message }) => (
  <div className={`message ${message.role}`}>
    {message.content}
  </div>
));

const MessageList = ({ messages }) => (
  <div className="message-list">
    {messages.map((msg, i) => (
      <Message key={i} message={msg} />
    ))}
  </div>
);
```

### Response Caching

```javascript
const createResponseCache = (ttlMs = 300000) => { // 5 minutes TTL
  const cache = new Map();
  
  const get = (key) => {
    const entry = cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > ttlMs) {
      cache.delete(key);
      return null;
    }
    
    return entry.value;
  };
  
  const set = (key, value) => {
    cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    // Clean cache if too large
    if (cache.size > 100) {
      const oldestKey = [...cache.entries()]
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      cache.delete(oldestKey);
    }
  };
  
  return { get, set };
};

// Usage
const responseCache = createResponseCache();
const cachedResponse = responseCache.get(query);
if (cachedResponse) {
  return cachedResponse;
} else {
  const response = await fetchResponse(query);
  responseCache.set(query, response);
  return response;
}
```

## Common Issues

### API Key Problems

```javascript
// Verify API key format before use
const isValidApiKey = (key, provider = 'openai') => {
  if (!key) return false;
  
  if (provider === 'openai' && key.startsWith('sk-') && key.length > 20) {
    return true;
  }
  
  if (provider === 'anthropic' && key.length > 20) {
    return true;
  }
  
  console.error(`Invalid ${provider} API key format`);
  return false;
};
```

### Component Not Rendering

```jsx
// Ensure all required props are provided
<InsuranceChat key="force-refresh" />

// Check if context provider is missing
<ChatProvider>
  <InsuranceChat />
</ChatProvider>

// Verify component mounting
useEffect(() => {
  console.log('InsuranceChat mounted');
  return () => console.log('InsuranceChat unmounted');
}, []);
```

### Rate Limit Errors

```javascript
// Handle 429 errors
try {
  await sendMessage(text);
} catch (error) {
  if (error.status === 429) {
    // Show user friendly message
    setError('We're experiencing high demand. Please try again in a moment.');
    
    // Implement automatic retry after delay
    setTimeout(() => {
      retryLastMessage();
    }, 5000);
  } else {
    setError(`Error: ${error.message}`);
  }
}
```

### Memory Leaks

```javascript
useEffect(() => {
  const timer = setInterval(() => {
    // Some operation
  }, 1000);
  
  // Always clean up timers
  return () => clearInterval(timer);
}, []);

// Clean up subscriptions
useEffect(() => {
  const subscription = someEventEmitter.subscribe(handleEvent);
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

For more detailed information, refer to:
- [Testing Guide](./TESTING.md)
- [Integration Tests](./INTEGRATION-TESTS.md)
- [CI/CD Setup](./CI-CD.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

## Performance Tips

### Response Time Optimization

```typescript
// Configure faster models for initial responses
const config = {
  defaultModel: 'gpt-3.5-turbo', // Faster than GPT-4
  fallbackModel: 'gpt-3.5-turbo-instruct', // Even faster fallback
  maxTokens: 150, // Limit response size
  temperature: 0.7
};

// Implement streaming responses for better UX
const useStreamedResponse = () => {
  const [partialResponse, setPartialResponse] = useState('');
  
  const streamResponse = async (message) => {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({ message }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    setPartialResponse('');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      setPartialResponse(prev => prev + chunk);
    }
  };
  
  return { partialResponse, streamResponse };
};
```

### Resource Management

```typescript
// Clear old messages to prevent memory issues
const useMessageCleanup = (maxAge = 3600000) => { // 1 hour
  const [messages, setMessages] = useState([]);
  
  // Clean up old messages periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      setMessages(current => 
        current.filter(msg => 
          Date.now() - new Date(msg.timestamp).getTime() < maxAge
        )
      );
    }, 300000); // Check every 5 minutes
    
    return () => clearInterval(cleanup);
  }, [maxAge]);
  
  return { messages, setMessages };
};

// Implement lazy loading for message history
const LazyLoadingChat = () => {
  const [page, setPage] = useState(1);
  const [messages, setMessages] = useState([]);
  
  // Load more messages when scrolling up
  const loadMoreMessages = useCallback(async () => {
    const olderMessages = await fetchMessages(page + 1);
    setMessages(prev => [...olderMessages, ...prev]);
    setPage(page + 1);
  }, [page]);
  
  return (
    <div>
      <button onClick={loadMoreMessages}>Load Previous Messages</button>
      <MessageList messages={messages} />
    </div>
  );
};
```

### Debounce Input

```typescript
// Debounce user input to reduce API calls
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Usage
const ChatInput = () => {
  const [input, setInput] = useState('');
  const debouncedInput = useDebounce(input, 300);
  
  // This effect only runs when the debounced value changes
  useEffect(() => {
    if (debouncedInput) {
      searchSuggestions(debouncedInput);
    }
  }, [debouncedInput]);
  
  return (
    <input 
      value={input} 
      onChange={e => setInput(e.target.value)} 
      placeholder="Ask about insurance..." 
    />
  );
};
```

## Quick Tips

1. **Development**
   - Use `localStorage.setItem('debug', 'true')` for detailed logs
   - Enable React DevTools for component inspection
   - Use the network tab to monitor API calls

2. **Testing**
   - Run unit tests before integration tests
   - Use `test.only()` for debugging specific tests
   - Mock API responses for consistent testing

3. **Performance**
   - Keep message history limited to reduce memory usage
   - Use `React.memo()` for message list components
   - Implement proper cleanup in `useEffect`
   - Use streaming responses for better perceived performance

4. **API Integration**
   - Always implement rate limit handling
   - Use exponential backoff for retries
   - Cache common responses when possible
   - Implement proper error handling

## Conclusion

This quick reference guide covers the most common tasks and solutions when working with the Insurance Chat module. Use it as a starting point for implementing and troubleshooting your chat interface.

For more detailed information:

- Review the comprehensive documentation files
- Explore the example implementations
- Check the test files for implementation patterns
- Use the troubleshooting guide for specific issues

Remember to always test thoroughly, especially with different AI providers and edge cases, to ensure a robust and reliable chat experience for your users.
