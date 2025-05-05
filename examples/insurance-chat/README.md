# Insurance Chat Examples

This directory contains example implementations of the Insurance Chat functionality, demonstrating different integration patterns and use cases for the life and health insurance chatbot.

## Available Examples

### 1. Basic Usage (`basic-usage.tsx`)

Demonstrates the simplest way to integrate the Insurance Chat component with default settings.

- Minimal configuration
- Default styling
- Built-in insurance knowledge base
- Pre-configured prompt buttons

![Basic Usage Screenshot](../../docs/images/basic-insurance-chat.png)

### 2. Multi-Provider Support (`multi-provider.tsx`)

Shows how to configure the Insurance Chat to work with different AI providers.

- Provider selection UI
- Dynamic configuration based on selected provider
- Support for OpenAI, Anthropic, and Mistral
- Provider-specific settings

![Multi-Provider Screenshot](../../docs/images/multi-provider-chat.png)

### 3. Advanced Features (`advanced-features.tsx`)

Demonstrates advanced usage with custom configurations and additional features.

- Knowledge base search
- Model selection
- Custom error handling
- Debug information
- Context-aware conversations

![Advanced Features Screenshot](../../docs/images/advanced-features-chat.png)

## How to Run the Examples

### Prerequisites

- Node.js 18+
- Bolt project set up
- API keys for at least one AI provider

### Setup

1. Install dependencies if you haven't already:
   ```bash
   pnpm install
   ```

2. Configure your API keys in the `.env` file:
   ```bash
   # OpenAI API Key (for GPT models)
   OPENAI_API_KEY=your_openai_key_here

   # Optional: Anthropic API Key (for Claude models)
   ANTHROPIC_API_KEY=your_anthropic_key_here

   # Optional: Mistral API Key
   MISTRAL_API_KEY=your_mistral_key_here
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Navigate to the example routes:
   - Basic: http://localhost:5173/examples/insurance-chat/basic
   - Multi-Provider: http://localhost:5173/examples/insurance-chat/multi-provider
   - Advanced: http://localhost:5173/examples/insurance-chat/advanced

## Testing the Examples

### Running Unit Tests

The examples have comprehensive unit tests that verify component rendering and interactions:

```bash
# Run all example tests
pnpm test examples/insurance-chat

# Run specific example tests
pnpm test examples/insurance-chat/basic-usage
pnpm test examples/insurance-chat/multi-provider
pnpm test examples/insurance-chat/advanced-features
```

### Running Integration Tests

Integration tests verify actual interactions with the AI services and require valid API keys:

```bash
# Run integration tests
pnpm test examples/insurance-chat/__tests__/integration.test.tsx
```

Note: Integration tests will automatically skip API-dependent tests if no API keys are available.

## Customizing the Examples

### Custom Configuration

All examples can be customized through props:

```tsx
<InsuranceChat
  config={{
    model: 'gpt-4', // Choose AI model
    temperature: 0.7, // Control response randomness
    maxTokens: 500 // Limit response length
  }}
  onError={(error) => console.error("Chat error:", error)}
  persistMessages={true} // Save chat history in localStorage
/>
```

### Custom Styling

You can customize the appearance by providing your own CSS classes:

```tsx
<InsuranceChat 
  className="my-custom-container" 
/>
```

### Custom Prompts

You can create your own set of prompt buttons by:

1. Creating a custom prompt component
2. Passing it to the InsuranceChat component

Example:
```tsx
import { InsuranceChat } from '~/components/chat/InsuranceChat';
import { MyCustomPrompts } from './MyCustomPrompts';

function CustomPromptExample() {
  return (
    <InsuranceChat 
      promptsComponent={MyCustomPrompts}
    />
  );
}
```

## Implementing in Your Project

### Basic Implementation

```tsx
import React from 'react';
import { InsuranceChat } from '~/components/chat/InsuranceChat';

export default function MyInsurancePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Insurance Assistant</h1>
      <InsuranceChat />
    </div>
  );
}
```

### Using the Hook Directly

For more control, you can use the `useInsuranceChat` hook:

```tsx
import React, { useState } from 'react';
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';

export default function CustomInsuranceChat() {
  const [input, setInput] = useState('');
  const { 
    messages, 
    isLoading, 
    error, 
    suggestions, 
    sendMessage 
  } = useInsuranceChat();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      await sendMessage(input);
      setInput('');
    }
  };

  return (
    <div>
      {/* Your custom UI implementation */}
      <form onSubmit={handleSubmit}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Ensure your API keys are correctly set in the `.env` file
   - Check if the API keys have the necessary permissions
   - Verify the API keys are valid and not expired

2. **Component Not Rendering**
   - Check if all required dependencies are installed
   - Verify you're importing the components from the correct paths
   - Check your browser console for any JavaScript errors

3. **Test Failures**
   - For integration tests, ensure you have valid API keys
   - Increase test timeout values for slow network connections
   - Check if you need to mock any environment variables

### Getting Help

If you encounter issues not covered here:

1. Check the main documentation in `/docs/insurance-chat.md`
2. Review existing issues in the project's issue tracker
3. Create a new issue with detailed reproduction steps

## Contributing

To add more examples:

1. Create a new example file in this directory
2. Add corresponding tests in the `__tests__` directory
3. Update this README to document your example
4. Submit a pull request

## License

These examples are covered by the project's main license. See the LICENSE file in the root directory for details.

