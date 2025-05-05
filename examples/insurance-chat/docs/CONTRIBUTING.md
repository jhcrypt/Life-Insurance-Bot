# Contributing to Insurance Chat

This guide outlines the process for contributing to the Insurance Chat module and its documentation.

## Table of Contents

- [Code Contributions](#code-contributions)
- [Documentation Contributions](#documentation-contributions)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Development Setup](#development-setup)

## Code Contributions

### Development Process

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/life-insurance-bot.git
   cd life-insurance-bot
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

4. **Test Your Changes**
   ```bash
   # Run all tests
   npm test
   
   # Run specific test suites
   npm test -- --testPathPattern="insurance-chat"
   ```

### Code Style Guidelines

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Add JSDoc comments for public APIs
- Use meaningful variable and function names

```typescript
// Example of good code style
/**
 * Processes an insurance query using the configured AI model
 * @param query - The user's insurance question
 * @param options - Optional processing options
 * @returns Processed response with insurance information
 */
async function processInsuranceQuery(
  query: string, 
  options?: ProcessOptions
): Promise<InsuranceResponse> {
  // Implementation
}
```

### Component Structure

- Use functional components with hooks
- Keep components focused on a single responsibility
- Extract reusable logic into custom hooks
- Follow the established project architecture

```typescript
// Example component structure
function InsurancePrompt({ category, text, onClick }: PromptProps) {
  return (
    <button 
      className={`prompt prompt--${category}`} 
      onClick={() => onClick(text)}
    >
      {text}
    </button>
  );
}
```

## Documentation Contributions

### Documentation Style

1. **Structure**
   - Use clear headings and subheadings
   - Include practical examples
   - Link to related documentation
   - Keep content focused and concise

2. **Code Examples**
   - Use TypeScript for all examples
   - Include comments explaining key concepts
   - Show both basic and advanced usage
   - Test all examples before submitting

3. **Formatting**
   - Use markdown consistently
   - Break up long sections with subheadings
   - Use lists for multiple related items
   - Include code blocks with proper syntax highlighting

### Documentation Testing

1. **Verify Links**
   - Check all internal links
   - Validate external references
   - Ensure code examples are current

2. **Review Content**
   - Check for technical accuracy
   - Verify instructions work as written
   - Update outdated information

## Testing Guidelines

### Writing Tests

1. **Unit Tests**
   - Test components in isolation
   - Mock external dependencies
   - Cover error cases
   - Test edge conditions

2. **Integration Tests**
   - Test real service interactions
   - Verify error handling
   - Test performance characteristics
   - Include rate limit handling

### Test Organization

```typescript
// Example test structure
describe('ComponentName', () => {
  // Setup/teardown
  beforeEach(() => {
    // Common setup
  });
  
  afterEach(() => {
    // Clean up
    jest.resetAllMocks();
  });
  
  describe('feature', () => {
    test('should behave in specific way', () => {
      // Arrange
      const props = { /* ... */ };
      
      // Act
      const result = someFunction(props);
      
      // Assert
      expect(result).toBe(expectedValue);
    });
    
    test('should handle errors', () => {
      // Error test implementation
    });
  });
});
```

### Test Naming Conventions

- Use descriptive test names that explain what is being tested
- Follow the pattern: `it/test('should [expected behavior] when [condition]')`
- Group related tests using `describe` blocks
- Separate setup, action, and assertions clearly

## Pull Request Process

1. **Before Submitting**
   - Run all tests
   - Update documentation
   - Add changelog entry
   - Review code style

2. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Performance improvement

   ## Testing
   Description of testing performed

   ## Screenshots
   If applicable

   ## Checklist
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] Changelog updated
   - [ ] Code follows style guidelines
   ```

3. **Review Process**
   - Address review comments
   - Update tests if needed
   - Maintain clean commit history
   - Request re-review when ready

## Development Setup

### Environment Setup

1. **Prerequisites**
   - Node.js 18+
   - npm or pnpm
   - Git

2. **Installation**
   ```bash
   # Install dependencies
   npm install

   # Copy environment template
   cp .env.example .env

   # Configure environment variables
   # Edit .env with your settings
   ```

3. **Development Server**
   ```bash
   # Start development server
   npm run dev

   # Run tests in watch mode
   npm test -- --watch
   ```

### API Keys for Development

For testing with real AI providers, you'll need to obtain API keys:

1. **OpenAI**
   - Create an account at [OpenAI](https://platform.openai.com/)
   - Generate an API key in the dashboard
   - Add to your `.env` file as `OPENAI_API_KEY`

2. **Anthropic**
   - Sign up at [Anthropic](https://www.anthropic.com/product)
   - Create an API key
   - Add to your `.env` file as `ANTHROPIC_API_KEY`

**Important**: Never commit API keys to version control. The `.env` file is listed in `.gitignore` for this reason.

### Debugging

1. **Enable Debug Logging**
   ```typescript
   // In browser development
   localStorage.setItem('debug', 'true');
   
   // In Node.js environment
   process.env.DEBUG = 'true';
   ```

2. **Use DevTools**
   - React DevTools for component inspection
   - Network tab for API calls
   - Console for debug output

3. **Debugging AI Responses**
   ```typescript
   // Add this to track AI responses
   useEffect(() => {
     if (process.env.NODE_ENV === 'development') {
       console.log('AI Response:', result.current.messages);
     }
   }, [result.current.messages]);
   ```

## Common Issues and Solutions

- **API Key Issues**: Verify key format and permissions
- **Rate Limiting**: Implement backoff strategy in tests
- **Test Timeouts**: Increase Jest timeout for integration tests
- **Component Testing**: Mock hooks and services consistently

## Questions and Support

- Create an issue for bugs or feature requests
- Join the development discussion
- Check existing documentation first

Thank you for contributing to the Insurance Chat module!

