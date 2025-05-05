# Insurance Chat Implementation Guide

## Overview

The Insurance Chat implementation enhances Bolt's existing chat functionality with specialized knowledge and capabilities for handling life and health insurance inquiries. It provides a tailored chat experience with insurance-specific prompts, knowledge base, and context-aware responses.

## Features

- **Insurance-specific Knowledge Base**: Built-in information about policy types, coverage options, and insurance terminology
- **Contextual Understanding**: Extracts and maintains information about policy types, coverage amounts, and health considerations
- **Specialized UI**: Categorized prompt buttons for common insurance questions
- **Follow-up Suggestions**: Context-aware follow-up question suggestions
- **AI Integration**: Seamless integration with Bolt's AI providers (OpenAI, Anthropic, etc.)
- **Fallback Handling**: Template-based responses when AI is unavailable

## Setup

### Installation

The insurance chat functionality is already integrated into the Bolt project. No additional installation is needed beyond the standard Bolt dependencies.

### Configuration

#### Environment Variables

You can configure the Insurance Chat behavior through environment variables:

```
# Insurance Chat Configuration
INSURANCE_DEFAULT_MODEL="gpt-4" # Default model for insurance queries
INSURANCE_FALLBACK_MODEL="gpt-3.5-turbo" # Fallback model if primary unavailable
INSURANCE_TEMPERATURE=0.7 # Temperature setting for insurance responses
INSURANCE_MAX_TOKENS=500 # Maximum token limit for responses
```

#### API Keys

The insurance chat uses the same API keys configured for Bolt, such as:

- `OPENAI_API_KEY` - For OpenAI models
- `ANTHROPIC_API_KEY` - For Anthropic Claude models
- And other provider keys as configured in Bolt

## Usage

### Basic Implementation

To use the default insurance chat interface:

```tsx
import { InsuranceChat } from '~/components/chat/InsuranceChat';

function MyInsurancePage() {
  return (
    <div className="container">
      <h1>Insurance Assistant</h1>
      <InsuranceChat className="my-chat-container" />
    </div>
  );
}

export default MyInsurancePage;
```

### Using the Hook

For more control, you can use the `useInsuranceChat` hook directly:

```tsx
import { useState } from 'react';
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';
import { ErrorAlert } from '~/components/ui/alerts/ErrorAlert';

function CustomInsuranceChat() {
  const [input, setInput] = useState('');
  
  const {
    messages,
    isLoading,
    error,
    suggestions,
    sendMessage,
    resetChat
  } = useInsuranceChat({
    onError: (err) => console.error('Chat error:', err.message),
    persistMessages: true
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    await sendMessage(input);
    setInput('');
  };
  
  return (
    <div className="custom-chat">
      {error && (
        <ErrorAlert 
          message={error.message} 
          onClose={() => setError(null)} 
        />
      )}
      
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      
      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((suggestion, i) => (
            <button 
              key={i}
              onClick={() => sendMessage(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about insurance..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
        <button type="button" onClick={resetChat}>
          Reset Chat
        </button>
      </form>
    </div>
  );
}
```

### Advanced Configuration

For advanced usage with custom configurations:

```tsx
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';

// Custom configuration
const insuranceConfig = {
  model: 'gpt-4o',  // Use a specific model
  temperature: 0.5, // Lower temperature for more deterministic responses
  maxTokens: 1000,  // Longer responses
  useAI: true       // Force AI usage even if config indicates otherwise
};

// With API keys for different providers
const apiKeys = {
  'OpenAI': process.env.CUSTOM_OPENAI_KEY,
  'Anthropic': process.env.CUSTOM_ANTHROPIC_KEY
};

// Provider-specific settings
const providerSettings = {
  'OpenAI': {
    baseUrl: 'https://custom-openai-endpoint.com',
    enabled: true
  }
};

function CustomConfigChat() {
  const chatOptions = useInsuranceChat({
    config: insuranceConfig,
    apiKeys,
    providerSettings,
    persistMessages: true
  });
  
  // Custom implementation...
}
```

## API Reference

### Components

#### `<InsuranceChat />`

Main component for the insurance chat interface.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `className` | `string` | Optional CSS class for styling |
| `onError` | `(err: Error) => void` | Optional error handler |
| `initialMessages` | `InsuranceMessage[]` | Optional initial messages |
| `config` | `Partial<InsuranceServiceConfig>` | Optional service configuration |

### Hooks

#### `useInsuranceChat(options)`

Hook for managing insurance chat state and interactions.

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `onError` | `(error: Error) => void` | Optional error handler |
| `initialMessages` | `InsuranceMessage[]` | Optional initial messages |
| `persistMessages` | `boolean` | Whether to persist messages to localStorage (default: true) |
| `config` | `Partial<InsuranceServiceConfig>` | Service configuration overrides |
| `apiKeys` | `Record<string, string>` | Provider API keys |
| `providerSettings` | `Record<string, IProviderSetting>` | Provider-specific settings |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `messages` | `InsuranceMessage[]` | Current chat messages |
| `isLoading` | `boolean` | Loading state |
| `error` | `Error \| null` | Current error state |
| `suggestions` | `string[]` | Follow-up suggestions |
| `sendMessage` | `(content: string) => Promise<void>` | Send a message |
| `resetChat` | `() => void` | Reset the chat state |
| `retryLastMessage` | `() => Promise<void>` | Retry the last failed message |
| `searchKnowledgeBase` | `(query: string) => KnowledgeBaseEntry[]` | Search the knowledge base |
| `setModelOverride` | `(modelName: string \| undefined) => void` | Override the model |

### Services

#### `InsuranceService`

Service for handling insurance-specific functionality.

**Methods:**

| Method | Description |
|--------|-------------|
| `processQuery(query: string, modelOverride?: string, apiKeys?: Record<string, string>, providerSettings?: Record<string, IProviderSetting>): Promise<string>` | Process a user query |
| `categorizeQuestion(question: string): Promise<QuestionCategory>` | Categorize a question |
| `generateFollowUpQuestions(category: QuestionCategory, query: string): string[]` | Generate follow-up questions |
| `searchKnowledgeBase(query: string): KnowledgeBaseEntry[]` | Search the knowledge base |
| `getPolicyInformation(policyType: string): Record<string, any> \| null` | Get information about a policy type |

### Types

#### `InsuranceMessage`

```typescript
interface InsuranceMessage {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  category?: QuestionCategory;
  suggestions?: string[];
}
```

#### `QuestionCategory`

```typescript
type QuestionCategory = 'basic' | 'health' | 'policy' | 'claims';
```

#### `InsuranceServiceConfig`

```typescript
interface InsuranceServiceConfig {
  model: string;        // Default AI model to use
  temperature: number;  // Temperature for generation
  maxTokens: number;    // Maximum tokens in response
  useAI?: boolean;      // Whether to use AI (vs. templates)
}
```

#### `KnowledgeBaseEntry`

```typescript
interface KnowledgeBaseEntry {
  term: string;
  definition: string;
  category: QuestionCategory;
  relatedTerms?: string[];
}
```

## Testing

The insurance chat implementation includes comprehensive tests:

- Component tests: `/app/components/chat/__tests__/InsuranceChat.test.tsx`
- Hook tests: `/app/lib/hooks/__tests__/useInsuranceChat.test.ts`
- Service tests: `/app/lib/modules/insurance/__tests__/insurance-service.test.ts`

To run the tests:

```bash
npm test -- --testPathPattern=insurance
```

## Common Use Cases

### 1. Basic Insurance Questions

The chat can answer general questions about insurance types, coverage, and terminology:

- "What types of life insurance policies are available?"
- "What's the difference between term and whole life insurance?"
- "How does universal life insurance work?"

### 2. Coverage Recommendations

It can provide personalized coverage recommendations based on contextual information:

- "I'm 35 years old with 2 kids. How much coverage do I need?"
- "What type of policy is best for estate planning?"
- "I want a $500,000 policy. What would the premium be?"

### 3. Health Assessments

It can address health-related insurance questions:

- "How do pre-existing conditions affect my coverage?"
- "Do I need a medical exam for term life insurance?"
- "I'm a smoker. How will that impact my premium?"

### 4. Claims Process

It can explain the claims process:

- "How does the claims process work?"
- "What documents are needed when filing a claim?"
- "How long does it take to receive a payout?"

## Troubleshooting

### Common Issues

1. **API Key Errors**: Make sure the appropriate provider API keys are set in the environment.
2. **Model Availability**: If a specified model is unavailable, the service will fall back to the default model.
3. **Local Storage Errors**: If persistent storage fails, check browser permissions and storage limits.

### Error Logging

All errors are logged with the `InsuranceService` or `useInsuranceChat` scope and can be found in the console.

## Contributing

To contribute to the insurance chat implementation:

1. Add new knowledge base entries in `app/lib/modules/insurance/utils/knowledge-base.ts`
2. Enhance prompt categories in `app/components/chat/InsurancePrompts.tsx`
3. Add tests for new functionality
4. Update this documentation with new features or changes

