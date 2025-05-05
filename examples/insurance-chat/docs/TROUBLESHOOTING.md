# Troubleshooting Guide for Insurance Chat

This guide helps you diagnose and resolve common issues with the Insurance Chat module, covering testing, API integration, CI/CD, and performance problems.

## Table of Contents

- [Testing Issues](#testing-issues)
  - [Unit Test Failures](#unit-test-failures)
  - [Integration Test Failures](#integration-test-failures)
  - [Test Environment Problems](#test-environment-problems)
- [API Integration Issues](#api-integration-issues)
  - [Authentication Problems](#authentication-problems)
  - [Rate Limiting](#rate-limiting)
  - [Response Format Changes](#response-format-changes)
- [CI/CD Pipeline Issues](#cicd-pipeline-issues)
  - [Build Failures](#build-failures)
  - [Deployment Problems](#deployment-problems)
  - [Environment Configuration](#environment-configuration)
- [Performance Problems](#performance-problems)
  - [Slow Response Times](#slow-response-times)
  - [Memory Leaks](#memory-leaks)
  - [Excessive Resource Usage](#excessive-resource-usage)
- [Debugging Techniques](#debugging-techniques)
  - [Logging Strategies](#logging-strategies)
  - [UI Debugging](#ui-debugging)
  - [Network Debugging](#network-debugging)

## Testing Issues

### Unit Test Failures

#### Problem: Component Tests Failing

**Symptoms**:
- `InsuranceChat` component tests fail with `TypeError: Cannot read properties of undefined`
- Errors mentioning missing elements or properties

**Solutions**:
1. **Check Mock Setup**:
   ```typescript
   // Ensure hook mock provides all required properties
   jest.mock('~/lib/hooks/useInsuranceChat', () => ({
     useInsuranceChat: () => ({
       messages: [],
       isLoading: false,
       error: null,
       suggestions: [],
       // Missing properties can cause errors:
       sendMessage: jest.fn(),
       resetChat: jest.fn(),
       retryLastMessage: jest.fn(),
       searchKnowledgeBase: jest.fn(),
       setModelOverride: jest.fn()
     })
   }));
   ```

2. **Update Component Test Snapshots**:
   ```bash
   # Update snapshots if UI has changed intentionally
   npm test -- -u
   ```

3. **Inspect Component Structure**:
   ```typescript
   // Use debug to inspect rendered component
   test('debugging component structure', () => {
     const { debug } = render(<InsuranceChat />);
     debug(); // Logs component structure to console
   });
   ```

#### Problem: Hook Tests Failing

**Symptoms**:
- `useInsuranceChat` hook tests fail with async errors
- Mock service not returning expected results

**Solutions**:
1. **Check Test Async Patterns**:
   ```typescript
   // Ensure proper async test pattern
   test('sends message', async () => {
     const { result } = renderHook(() => useInsuranceChat());
     
     // Always wrap async actions in act
     await act(async () => {
       await result.current.sendMessage('Test message');
     });
     
     // Check result after act completes
     expect(result.current.messages.length).toBe(2);
   });
   ```

2. **Verify Service Mocks**:
   ```typescript
   // Make sure service mock resolves correctly
   jest.mock('~/lib/modules/insurance/services/insurance-service', () => ({
     InsuranceService: jest.fn().mockImplementation(() => ({
       processQuery: jest.fn().mockResolvedValue('Test response'),
       // other methods...
     }))
   }));
   ```

3. **Reset Mocks Between Tests**:
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

### Integration Test Failures

#### Problem: API Connection Failures

**Symptoms**:
- Integration tests fail with connection errors
- Timeouts when connecting to AI services

**Solutions**:
1. **Verify API Keys**:
   ```typescript
   beforeAll(() => {
     // Check if API keys are available
     if (!process.env.OPENAI_API_KEY) {
       console.warn('⚠️ Missing OpenAI API key - tests will be skipped');
     }
   });
   ```

2. **Implement Conditional Tests**:
   ```typescript
   // Only run test if API key is available
   const testOrSkip = process.env.OPENAI_API_KEY ? test : test.skip;
   
   testOrSkip('calls real API', async () => {
     // Test implementation...
   });
   ```

3. **Check Network Status**:
   ```typescript
   // Add pre-check for network connectivity
   beforeAll(async () => {
     try {
       await fetch('https://api.openai.com/v1/models', {
         headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
       });
       console.log('API connection successful');
     } catch (error) {
       console.error('API connection failed:', error);
     }
   });
   ```

#### Problem: Inconsistent AI Responses

**Symptoms**:
- Tests expecting specific content in AI responses fail intermittently 
- Response content changes between test runs

**Solutions**:
1. **Use Flexible Matchers**:
   ```typescript
   // Test for key concepts rather than exact text
   test('AI response contains relevant information', async () => {
     // Test implementation...
     
     const response = result.current.messages[1].content.toLowerCase();
     expect(response).toContain('insurance');
     
     // Check for at least one concept from a list
     const hasRelevantConcepts = [
       'policy', 'coverage', 'premium', 'term'
     ].some(concept => response.includes(concept));
     
     expect(hasRelevantConcepts).toBe(true);
   });
   ```

2. **Mock for Deterministic Tests**:
   ```typescript
   // For repeatable tests, use deterministic mocks
   jest.mock('~/lib/modules/insurance/services/insurance-service', () => ({
     InsuranceService: jest.fn().mockImplementation(() => ({
       processQuery: jest.fn().mockResolvedValue(
         'Term life insurance provides coverage for a specific period.'
       ),
       // other methods...
     }))
   }));
   ```

3. **Use Retry Logic for Flaky Tests**:
   ```typescript
   const retryTest = async (testFn, maxRetries = 3) => {
     for (let i = 0; i < maxRetries; i++) {
       try {
         await testFn();
         return; // Test passed
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         console.log(`Retrying test (${i+1}/${maxRetries})`);
         await new Promise(r => setTimeout(r, 1000));
       }
     }
   };
   ```

### Test Environment Problems

#### Problem: Test Environment Configuration

**Symptoms**:
- Tests pass locally but fail in CI
- Environment-specific failures

**Solutions**:
1. **Set Up Test Environment Variables**:
   ```bash
   # .env.test
   NODE_ENV=test
   MOCK_AI_RESPONSES=true
   TEST_TIMEOUT=30000
   ```

2. **Configure Jest Timeout**:
   ```javascript
   // jest.config.js
   module.exports = {
     testTimeout: 30000, // 30 seconds
     // other configs...
   };
   ```

3. **Use CI Detection**:
   ```typescript
   const isCI = process.env.CI === 'true';
   
   // Adjust test behavior in CI
   beforeAll(() => {
     if (isCI) {
       jest.setTimeout(60000); // Longer timeout in CI
     }
   });
   ```

## API Integration Issues

### Authentication Problems

#### Problem: API Key Issues

**Symptoms**:
- `401 Unauthorized` errors
- Authentication failed messages

**Solutions**:
1. **Verify API Key Format**:
   ```typescript
   // Check API key format before use
   const validateApiKey = (key) => {
     if (!key) return false;
     if (key.startsWith('sk-') && key.length > 20) return true;
     console.error('Invalid API key format');
     return false;
   };
   ```

2. **Check Environment Variables**:
   ```typescript
   // Check for missing or empty keys
   if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
     console.error('OpenAI API key is missing or empty');
   }
   ```

3. **Test API Key Validity**:
   ```typescript
   // Create a simple validity test
   const testApiKey = async (key) => {
     try {
       const response = await fetch('https://api.openai.com/v1/models', {
         headers: { Authorization: `Bearer ${key}` }
       });
       return response.ok;
     } catch (error) {
       console.error('API key validation failed:', error);
       return false;
     }
   };
   ```

#### Problem: Missing Authentication Headers

**Symptoms**:
- API calls fail with authentication errors
- Missing auth header warnings

**Solutions**:
1. **Verify Authorization Headers**:
   ```typescript
   // Ensure headers are properly formatted
   const headers = {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${apiKey}`
   };
   ```

2. **Debug Network Requests**:
   ```typescript
   // Log requests in development
   if (process.env.NODE_ENV === 'development') {
     console.log('Request headers:', headers);
   }
   ```

3. **Implement Auth Interceptor**:
   ```typescript
   // Add auth headers to all requests
   const addAuthToRequest = (req) => {
     if (!req.headers.has('Authorization')) {
       req.headers.set('Authorization', `Bearer ${getApiKey()}`);
     }
     return req;
   };
   ```

### Rate Limiting

#### Problem: Too Many Requests

**Symptoms**:
- `429 Too Many Requests` errors
- Tests or features failing during heavy usage
- Message about "rate limit exceeded"

**Solutions**:
1. **Implement Throttling**:
   ```typescript
   // Add delay between requests
   const sendWithDelay = async (message, delay = 1000) => {
     if (lastRequestTime) {
       const elapsed = Date.now() - lastRequestTime;
       if (elapsed < delay) {
         await new Promise(r => setTimeout(r, delay - elapsed));
       }
     }
     
     lastRequestTime = Date.now();
     return await api.sendMessage(message);
   };
   ```

2. **Add Exponential Backoff**:
   ```typescript
   // Retry with exponential backoff
   const sendWithRetry = async (message, maxRetries = 3) => {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await api.sendMessage(message);
       } catch (error) {
         if (error.status === 429) {
           const delay = Math.pow(2, i) * 1000;
           console.log(`Rate limited, waiting ${delay}ms before retry`);
           await new Promise(r => setTimeout(r, delay));
         } else {
           throw error;
         }
       }
     }
     throw new Error('Max retries exceeded');
   };
   ```

3. **Implement Request Pooling**:
   ```typescript
   // Create a request pool to limit concurrent requests
   class RequestPool {
     constructor(maxConcurrent = 5) {
       this.maxConcurrent = maxConcurrent;
       this.running = 0;
       this.queue = [];
     }
     
     async add(fn) {
       if (this.running >= this.maxConcurrent) {
         // Wait for a slot to open
         await new Promise(resolve => this.queue.push(resolve));
       }
       
       this.running++;
       try {
         return await fn();
       } finally {
         this.running--;
         if (this.queue.length > 0) {
           const next = this.queue.shift();
           next();
         }
       }
     }
   }
   
   // Usage
   const pool = new RequestPool(3);
   await pool.add(() => api.sendMessage('Test'));
   ```

### Response Format Changes

#### Problem: API Changes Break Integration

**Symptoms**:
- Unexpected response formats
- Type errors when processing responses
- Properties missing from responses

**Solutions**:
1. **Implement Response Validation**:
   ```typescript
   // Validate response shape
   const validateResponse = (response) => {
     if (!response || typeof response !== 'object') {
       throw new Error('Invalid response format');
     }
     
     if (!response.choices || !Array.isArray(response.choices)) {
       throw new Error('Missing choices array in response');
     }
     
     return response;
   };
   ```

2. **Use Defensive Coding**:
   ```typescript
   // Extract message content safely
   const getResponseContent = (response) => {
     try {
       return response?.choices?.[0]?.message?.content || '';
     } catch (error) {
       console.error('Failed to extract content:', error);
       return '';
     }
   };
   ```

3. **Version Check API**:
   ```typescript
   // Check API version before use
   const checkApiVersion = async () => {
     try {
       const response = await fetch('https://api.example.com/version');
       const data = await response.json();
       
       if (data.version !== expectedVersion) {
         console.warn(`API version mismatch: expected ${expectedVersion}, got ${data.version}`);
       }
     } catch (error) {
       console.error('Failed to check API version:', error);
     }
   };
   ```

## CI/CD Pipeline Issues

### Build Failures

#### Problem: Build Failing in CI

**Symptoms**:
- Builds pass locally but fail in CI
- TypeScript errors in CI only
- Path resolution issues

**Solutions**:
1. **Sync TypeScript Versions**:
   ```json
   // package.json
   {
     "engines": {
       "node": ">=18.0.0",
       "npm": ">=9.0.0"
     },
     "devDependencies": {
       "typescript": "4.9.5"
     }
   }
   ```

2. **CI-Specific tsconfig**:
   ```json
   // tsconfig.ci.json
   {
     "extends": "./tsconfig.json",
     "compilerOptions": {
       "skipLibCheck": false,
       "strict": true
     }
   }
   ```

3. **Add Path Aliases Check**:
   ```yaml
   # CI workflow step
   - name: Verify path aliases
     run: |
       grep -r "from '~/" --include="*.ts" --include="*.tsx" src/
       if [ $? -ne 0 ]; then
         echo "No path aliases found in source code"
       else
         echo "Path aliases used in source code, checking tsconfig..."
         grep -q "\"~/*\":" tsconfig.json
         if [ $? -ne 0 ]; then
           echo "Error: Path aliases used but not configured in tsconfig.json"
           exit 1
         fi
       fi
   ```

### Deployment Problems

#### Problem: Failed Deployments

**Symptoms**:
- Deployment step fails in pipeline
- Application doesn't update after successful build
- Environment configuration issues

**Solutions**:
1. **Verify Build Artifacts**:
   ```yaml
   # CI workflow step to check build artifacts
   - name: Check build artifacts
     run: |
       if [ ! -d "build" ]; then
         echo "Build directory missing"
         exit 1
       fi
       
       # Check for essential files
       required_files=("index.html" "static/js/main.js" "static/css/main.css")
       for file in "${required_files[@]}"; do
         if [ ! -f "build/$file" ]; then
           echo "Missing required file: $file"
           exit 1
         fi
       done
   ```

2. **Environment Validation**:
   ```yaml
   - name: Validate environment
     run: |
       # Check required environment variables
       required_vars=("REACT_APP_API_URL" "OPENAI_API_KEY")
       for var in "${required_vars[@]}"; do
         if [ -z "${!var}" ]; then
           echo "Missing required environment variable: $var"
           exit 1
         fi
       done
   ```

3. **Health Check After Deploy**:
   ```yaml
   - name: Verify deployment
     run: |
       max_attempts=5
       attempt=1
       
       while [ $attempt -le $max_attempts ]; do
         echo "Checking deployment health (attempt $attempt/$max_attempts)"
         
         response=$(curl -s https://api.example.com/health)
         if [[ $response == *"healthy"* ]]; then
           echo "Deployment verified successfully"
           exit 0
         fi
         
         attempt=$((attempt + 1))
         sleep 10
       done
       
       echo "Deployment health check failed after $max_attempts attempts"
       exit 1
   ```

### Environment Configuration

#### Problem: Environment Variables Issues

**Symptoms**:
- Application behaves differently in different environments
- Configuration-related errors
- Missing API keys or endpoints

**Solutions**:
1. **Use Environment Templates**:
   ```bash
   # Create template files for each environment
   cp .env.example .env.development
   cp .env.example .env.staging
   cp .env.example .env.production
   
   # Edit each with appropriate values
   # Then in CI, copy the right one
   if [[ "$GITHUB_REF" == "refs/heads/main" ]]; then
     cp .env.production .env
   elif [[ "$GITHUB_REF" == "refs/heads/develop" ]]; then
     cp .env.staging .env
   else
     cp .env.development .env
   fi
   ```

2. **Validate Environment Config**:
   ```typescript
   // Validate environment at startup
   const validateEnv = () => {
     const requiredVars = [
       'REACT_APP_API_URL',
       'REACT_APP_OPENAI_API_KEY'
     ];
     
     const missing = requiredVars.filter(
       varName => !process.env[varName]
     );
     
     if (missing.length > 0) {
       console.error(`Missing required environment variables: ${missing.join(', ')}`);
       return false;
     }
     
     return true;
   };
   ```

3. **Use CI Environment Files**:
   ```yaml
   - name: Set up environment
     run: |
       # Create environment file from secrets
       cat > .env << EOF
       REACT_APP_API_URL=${{ secrets.API_URL }}
       REACT_APP_OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }}
       REACT_APP_ENVIRONMENT=${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
       EOF
   ```

## Performance Problems

### Slow Response Times

#### Problem: Chat Responses Are Slow

**Symptoms**:
- Long wait times for AI responses
- UI feels unresponsive
- Timeouts in tests

**Solutions**:
1. **Implement Request Timeouts**:
   ```typescript
   const sendMessageWithTimeout = async (message: string, timeout = 10000) => {
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), timeout);
     
     try {
       const response = await fetch('/api/chat', {
         method: 'POST',
         body: JSON.stringify({ message }),
         signal: controller.signal
       });
       return await response.json();
     } catch (error) {
       if (error.name === 'AbortError') {
         throw new Error('Request timed out');
       }
       throw error;
     } finally {
       clearTimeout(timeoutId);
     }
   };
   ```

2. **Optimize AI Parameters**:
   ```typescript
   // Use faster models with optimized parameters
   const optimizedConfig = {
     model: 'gpt-3.5-turbo', // Faster than GPT-4
     temperature: 0.7,
     max_tokens: 150, // Limit response size
     presence_penalty: 0,
     frequency_penalty: 0
   };
   ```

3. **Implement Response Streaming**:
   ```typescript
   // Stream responses for better perceived performance
   const streamResponse = async (message: string, onChunk: (chunk: string) => void) => {
     const response = await fetch('/api/chat/stream', {
       method: 'POST',
       body: JSON.stringify({ message }),
       headers: {
         'Content-Type': 'application/json'
       }
     });
     
     const reader = response.body?.getReader();
     if (!reader) return;
     
     const decoder = new TextDecoder();
     let buffer = '';
     
     while (true) {
       const { done, value } = await reader.read();
       if (done) break;
       
       buffer += decoder.decode(value, { stream: true });
       
       // Process complete chunks
       const chunks = buffer.split('\n\n');
       buffer = chunks.pop() || '';
       
       for (const chunk of chunks) {
         if (chunk.startsWith('data: ')) {
           const content = chunk.slice(6);
           if (content !== '[DONE]') {
             try {
               const data = JSON.parse(content);
               onChunk(data.choices[0]?.delta?.content || '');
             } catch (e) {
               console.error('Error parsing chunk:', e);
             }
           }
         }
       }
     }
   };
   ```

### Memory Leaks

#### Problem: Memory Usage Grows Over Time

**Symptoms**:
- Increasing memory usage
- Performance degradation over time
- Browser tab crashes after extended use

**Solutions**:
1. **Track Message History Size**:
   ```typescript
   const useMessageHistoryManager = (maxMessages = 100) => {
     const [messages, setMessages] = useState<Message[]>([]);
     
     const addMessage = useCallback((message: Message) => {
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

2. **Clean Up Event Listeners**:
   ```typescript
   useEffect(() => {
     const subscription = eventEmitter.on('message', handleMessage);
     
     // Return cleanup function
     return () => {
       subscription.off();
     };
   }, []);
   ```

3. **Monitor Memory Usage**:
   ```typescript
   // Add development memory monitoring
   if (process.env.NODE_ENV === 'development') {
     const memoryMonitor = setInterval(() => {
       const memoryUsage = performance.memory 
         ? Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)) 
         : 'N/A';
       console.log(`Memory usage: ${memoryUsage} MB`);
     }, 10000);
     
     // Clean up
     return () => clearInterval(memoryMonitor);
   }
   ```

### Excessive Resource Usage

#### Problem: High CPU/Network Usage

**Symptoms**:
- High CPU usage during chat interactions
- Excessive network requests
- Battery drain on mobile devices

**Solutions**:
1. **Implement Debouncing**:
   ```typescript
   // Debounce frequently called functions
   const debounce = (fn: Function, delay: number) => {
     let timeoutId: NodeJS.Timeout;
     return function(...args: any[]) {
       clearTimeout(timeoutId);
       timeoutId = setTimeout(() => fn(...args), delay);
     };
   };
   
   // Usage
   const debouncedSearch = debounce((query) => {
     searchKnowledgeBase(query);
   }, 300);
   ```

2. **Optimize Renders**:
   ```typescript
   // Use React.memo for expensive components
   const MessageItem = React.memo(({ message }: { message: Message }) => {
     return (
       <div className={`message ${message.role}`}>
         {message.content}
       </div>
     );
   });
   
   // Use useMemo for expensive calculations
   const categorizedMessages = useMemo(() => {
     return messages.reduce((acc, message) => {
       const category = message.category || 'general';
       acc[category] = [...(acc[category] || []), message];
       return acc;
     }, {} as Record<string, Message[]>);
   }, [messages]);
   ```

3. **Implement Response Caching**:
   ```typescript
   // Simple cache for common queries
   const queryCache = new Map<string, {
     response: string;
     timestamp: number;
   }>();
   
   const getCachedResponse = (query: string) => {
     const cached = queryCache.get(query);
     
     // Return if found and not expired (10 min TTL)
     if (cached && Date.now() - cached.timestamp < 600000) {
       return cached.response;
     }
     
     return null;
   };
   
   const setCachedResponse = (query: string, response: string) => {
     queryCache.set(query, {
       response,
       timestamp: Date.now()
     });
     
     // Prune cache if too large
     if (queryCache.size > 100) {
       const oldestKey = [...queryCache.entries()]
         .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
       queryCache.delete(oldestKey);
     }
   };
   ```

## Debugging Techniques

### Logging Strategies

#### Enhanced Debug Logging

```typescript
// Create a debug logger
const createLogger = (module: string) => {
  const debug = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
  
  return {
    info: (...args: any[]) => {
      if (debug) console.log(`[${module}] INFO:`, ...args);
    },
    warn: (...args: any[]) => {
      if (debug) console.warn(`[${module}] WARN:`, ...args);
    },
    error: (...args: any[]) => {
      console.error(`[${module}] ERROR:`, ...args);
    },
    time: (label: string) => {
      if (debug) console.time(`[${module}] ${label}`);
    },
    timeEnd: (label: string) => {
      if (debug) console.timeEnd(`[${module}] ${label}`);
    }
  };
};

// Usage
const logger = createLogger('InsuranceChat');
logger.info('Initializing chat...');
logger.time('Message processing');
// ... do work
logger.timeEnd('Message processing');
```

### UI Debugging

#### Component State Inspection

```typescript
import { useDebugValue } from 'react';

// Hook to expose values in React DevTools
const useDebugState = (value: any, name: string) => {
  useDebugValue(`${name}: ${JSON.stringify(value)}`);
  return value;
};

// Usage in hook
const useInsuranceChatDebug = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  useDebugState(messages, 'Chat Messages');
  
  // Debugging state for other values
  const [isLoading, setIsLoading] = useState(false);
  useDebugState(isLoading, 'Loading State');
  
  return { messages, setMessages, isLoading, setIsLoading };
};
```

#### React DevTools Integration

```typescript
// Create a component for debugging overlays
const DebugInfo = ({ show = false, data }: { show?: boolean; data: any }) => {
  // Only show in development and when enabled
  if (!show || process.env.NODE_ENV === 'production') return null;
  
  return (
    <pre className="debug-info" style={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      maxHeight: '200px',
      maxWidth: '400px',
      overflow: 'auto',
      zIndex: 9999
    }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

// Usage in component
const InsuranceChat = () => {
  const chat = useInsuranceChat();
  const isDebugEnabled = localStorage.getItem('debug') === 'true';
  
  return (
    <div className="insurance-chat">
      {/* Regular component content */}
      <DebugInfo show={isDebugEnabled} data={{
        messages: chat.messages,
        state: {
          loading: chat.isLoading,
          error: chat.error,
          suggestions: chat.suggestions.length
        }
      }} />
    </div>
  );
};
```

#### DOM Element Inspection

```typescript
// Helper function to debug elements
const debugElement = (element: HTMLElement | null) => {
  if (!element) {
    console.error('Element not found');
    return;
  }
  
  console.log('Element:', element);
  console.log('Classes:', element.className);
  console.log('Attributes:', element.attributes);
  console.log('Children:', element.children.length);
  console.log('Computed Style:', window.getComputedStyle(element));
};

// Usage in component
const MessageList = () => {
  const listRef = useRef<HTMLDivElement>(null);
  
  // Debug in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      debugElement(listRef.current);
    }
  }, []);
  
  return <div ref={listRef} className="message-list">{/* content */}</div>;
};
```

### Network Debugging

#### Request/Response Logging

```typescript
// Create a debug fetch wrapper
const debugFetch = async (url: string, options: RequestInit) => {
  const logger = createLogger('Network');
  
  logger.info('Request:', {
    url,
    method: options.method,
    headers: options.headers
  });
  
  try {
    const response = await fetch(url, options);
    
    logger.info('Response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    // Clone response so we can read it twice
    const clone = response.clone();
    try {
      const body = await clone.text();
      const json = JSON.parse(body);
      logger.info('Response body:', json);
    } catch (e) {
      logger.warn('Could not parse response as JSON:', e);
    }
    
    return response;
  } catch (error) {
    logger.error('Request failed:', error);
    throw error;
  }
};

// Usage
const fetchMessages = async () => {
  return await debugFetch('/api/messages', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
  });
};
```

#### API Request Debugging

```typescript
// Intercept all fetch requests for debugging
const setupFetchDebugger = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
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
};

// Enable in the app entry point for development
if (process.env.NODE_ENV === 'development') {
  setupFetchDebugger();
}
```

## Summary

When troubleshooting issues with the Insurance Chat implementation, follow these steps:

1. **Identify the Problem Area**
   - Is it a testing issue, API integration problem, CI/CD failure, or performance concern?
   - Check logs and error messages for specific details
   - Isolate to a specific component, function, or environment

2. **Verify Configuration and Environment**
   - Confirm API keys and authorization are correct
   - Check environment variables and settings
   - Verify proper model and parameter configurations
   - Ensure all dependencies are installed correctly

3. **Apply Systematic Testing**
   - Run unit tests to verify component behavior
   - Use integration tests to check system interactions
   - Test in isolation to eliminate external factors
   - Add debugging output to trace execution flow

4. **Monitor Resources and Performance**
   - Track memory usage for potential leaks
   - Monitor response times for slowdowns
   - Check CPU and network utilization
   - Optimize resource-intensive operations

5. **Implement Best Practices**
   - Use proper error handling with helpful messages
   - Implement retry logic with exponential backoff
   - Apply caching for frequent operations
   - Clean up resources properly
   - Add defensive coding for external dependencies

Common patterns to look for:

- **Intermittent failures** often indicate rate limiting or network issues
- **Gradual performance degradation** suggests memory leaks
- **Environment-specific problems** point to configuration issues
- **Changes in API responses** require updating parsing logic

When implementing fixes:

1. Document both the problem and solution
2. Add tests to prevent regression
3. Update documentation if interfaces changed
4. Share knowledge with the team

For ongoing monitoring:

1. Set up alerts for key metrics
2. Add logging for critical operations
3. Implement health checks
4. Create dashboards for performance visualization

Remember that the most effective troubleshooting combines systematic investigation, thorough documentation, and preventive measures to avoid similar issues in the future.

## Conclusion

Troubleshooting is an essential skill when working with the Insurance Chat module, particularly due to the complex interactions between frontend components, AI services, and various environments. By following the structured approach outlined in this guide, you can efficiently identify, diagnose, and resolve issues.

Key takeaways:

1. **Start with logs and error messages** - They often point directly to the problem
2. **Use the debugging tools provided** - Including UI debuggers, network inspectors, and performance monitors
3. **Test systematically** - Start with unit tests and work your way up to integration tests
4. **Document solutions** - Share knowledge to prevent others from encountering the same issues

If you discover new issues or innovative solutions, consider contributing to this troubleshooting guide to help the team build a more robust Insurance Chat implementation.
