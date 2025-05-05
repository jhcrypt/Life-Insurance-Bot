import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InsuranceChat } from '../InsuranceChat';
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';
import type { InsuranceMessage } from '~/lib/hooks/useInsuranceChat';
import { act } from 'react-dom/test-utils';

// Mock the useInsuranceChat hook
jest.mock('~/lib/hooks/useInsuranceChat', () => ({
  useInsuranceChat: jest.fn()
}));

describe('InsuranceChat', () => {
  // Default mock implementation
  const defaultMockHook = {
    messages: [],
    isLoading: false,
    error: null,
    suggestions: [],
    sendMessage: jest.fn().mockResolvedValue(undefined),
    resetChat: jest.fn(),
    retryLastMessage: jest.fn(),
    searchKnowledgeBase: jest.fn().mockReturnValue([]),
    setModelOverride: jest.fn()
  };

  beforeEach(() => {
    (useInsuranceChat as jest.Mock).mockImplementation(() => defaultMockHook);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders chat interface correctly', () => {
      render(<InsuranceChat />);
      
      // Check for input field
      expect(screen.getByPlaceholder(/Ask me anything about insurance/i)).toBeInTheDocument();
      
      // Check for send button (might be disabled initially)
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeInTheDocument();
      expect(sendButton).toBeDisabled(); // Typically disabled when input is empty
      
      // Check for insurance prompts section
      expect(screen.getByText(/Basic Insurance Info/i)).toBeInTheDocument();
    });

    test('displays loading state correctly', () => {
      // Mock loading state
      (useInsuranceChat as jest.Mock).mockImplementation(() => ({
        ...defaultMockHook,
        isLoading: true
      }));

      render(<InsuranceChat />);
      
      // When loading, should show a loading indicator
      expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('displays error state correctly', () => {
      // Mock error state
      const errorMessage = 'Failed to connect to insurance service';
      (useInsuranceChat as jest.Mock).mockImplementation(() => ({
        ...defaultMockHook,
        error: new Error(errorMessage)
      }));

      render(<InsuranceChat />);
      
      // Error message should be displayed
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      
      // Error alert should have a close button
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    test('displays messages correctly', () => {
      // Mock messages
      const messages: InsuranceMessage[] = [
        {
          role: 'user',
          content: 'What types of life insurance are available?',
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: 'There are several types of life insurance: term life, whole life, universal life, and variable life insurance. Each has different features and benefits.',
          timestamp: new Date(),
          category: 'basic',
          suggestions: ['How does term life work?', 'What is whole life insurance?']
        }
      ];

      (useInsuranceChat as jest.Mock).mockImplementation(() => ({
        ...defaultMockHook,
        messages
      }));

      render(<InsuranceChat />);
      
      // User message should be displayed
      expect(screen.getByText(messages[0].content)).toBeInTheDocument();
      
      // Assistant message should be displayed
      expect(screen.getByText(messages[1].content)).toBeInTheDocument();
    });

    test('displays suggestions from response', () => {
      // Mock suggestions
      const suggestions = ['How much coverage do I need?', 'What affects my premium rate?'];
      
      (useInsuranceChat as jest.Mock).mockImplementation(() => ({
        ...defaultMockHook,
        suggestions
      }));

      render(<InsuranceChat />);
      
      // Suggestions should be displayed
      expect(screen.getByText(suggestions[0])).toBeInTheDocument();
      expect(screen.getByText(suggestions[1])).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('allows typing in input field', () => {
      render(<InsuranceChat />);
      
      const input = screen.getByPlaceholder(/Ask me anything about insurance/i);
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      
      expect(input).toHaveValue('Test message');
    });

    test('enables send button when input has content', () => {
      render(<InsuranceChat />);
      
      const input = screen.getByPlaceholder(/Ask me anything about insurance/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Initially disabled
      expect(sendButton).toBeDisabled();
      
      // Add content
      fireEvent.change(input, { target: { value: 'Test message' } });
      
      // Should be enabled
      expect(sendButton).not.toBeDisabled();
    });

    test('sends message on button click', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      
      (useInsuranceChat as jest.Mock).mockImplementation(() => ({
        ...defaultMockHook,
        sendMessage: mockSendMessage
      }));

      render(<InsuranceChat />);
      
      const input = screen.getByPlaceholder(/Ask me anything about insurance/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Add content and submit
      await act(async () => {
        fireEvent.change(input, { target: { value: 'What is term life insurance?' } });
      });
      
      await act(async () => {
        fireEvent.click(sendButton);
      });
      
      // Check if sendMessage was called with the correct argument
      expect(mockSendMessage).toHaveBeenCalledWith('What is term life insurance?');
      
      // Input should be cleared after sending
      expect(input).toHaveValue('');
    });

    test('sends message on enter key', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      
      (useInsuranceChat as jest.Mock).mockImplementation(() => ({
        ...defaultMockHook,
        sendMessage: mockSendMessage
      }));

      render(<InsuranceChat />);
      
      const input = screen.getByPlaceholder(/Ask me anything about insurance/i);
      
      // Add content and press Enter
      await act(async () => {
        fireEvent.change(input, { target: { value: 'What is term life insurance?' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      });
      
      // Check if sendMessage was called with the correct argument
      expect(mockSendMessage).toHaveBeenCalledWith('What is term life insurance?');
    });

    test('clicks on suggestion sends that message', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      const suggestions = ['How much coverage do I need?', 'What affects my premium rate?'];
      
      (useInsuranceChat as jest.Mock).mockImplementation(() => ({
        ...defaultMockHook,
        sendMessage: mockSendMessage,
        suggestions
      }));

      render(<InsuranceChat />);
      
      // Find and click the first suggestion
      const suggestionButton = screen.getByText(suggestions[0]);
      
      await act(async () => {
        fireEvent.click(suggestionButton);
      });
      
      // Check if sendMessage was called with the suggestion text
      expect(mockSendMessage).toHaveBeenCalledWith(suggestions[0]);
    });

    test('dismisses error alert when clicking close', async () => {
      // Mock error state
      const errorMessage = 'Failed to connect to insurance service';
      const mockSetError = jest.fn();
      
      (useInsuranceChat as jest.Mock).mockImplementation(() => ({
        ...defaultMockHook,
        error: new Error(errorMessage),
        // Mock the onError callback that would normally clear the error
        onError: mockSetError
      }));

      const { rerender } = render(<InsuranceChat />);
      
      // Error message should initially be displayed
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      
      // Find and click close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      
      await act(async () => {
        fireEvent.click(closeButton);
      });
      
      // After clicking close, error should be cleared
      // Simulate error being cleared in the hook
      (useInsuranceChat as jest.Mock).mockImplementation(() => ({
        ...defaultMockHook,
        error: null
      }));
      
      rerender(<InsuranceChat />);
      
      // Error message should no longer be displayed
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });

    test('clicks on prompt buttons send predefined queries', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      
      (useInsuranceChat as jest.Mock).mockImplementation(() => ({
        ...defaultMockHook,
        sendMessage: mockSendMessage
      }));

      render(<InsuranceChat />);
      
      // Find and click a predefined prompt button (e.g., "Types of policies")
      const promptButton = screen.getByText(/Types of policies/i);
      
      await act(async () => {
        fireEvent.click(promptButton);
      });
      
      // Should send the predefined query text
      expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining("types of life insurance"));
    });
  });

  describe('Integration', () => {
    test('resets chat when reset button is clicked', async () => {
      const mockResetChat = jest.fn();
      
      (useInsuranceChat as jest.Mock).mockImplementation(() => ({
        ...defaultMockHook,
        resetChat: mockResetChat
      }));

      render(<InsuranceChat />);
      
      // Find and click reset button
      const resetButton = screen.getByRole('button', { name: /reset/i });
      
      await act(async () => {
        fireEvent.click(resetButton);
      });
      
      // Should call resetChat
      expect(mockResetChat).toHaveBeenCalled();
    });

    test('processes complete conversation flow', async () => {
      // Create a mocked version of useInsuranceChat that updates messages
      let mockMessages: InsuranceMessage[] = [];
      const mockSendMessage = jest.fn().mockImplementation(async (content: string) => {
        // Add a user message
        mockMessages.push({
          role: 'user',
          content,
          timestamp: new Date()
        });
        
        // Add a simulated response
        mockMessages.push({
          role: 'assistant',
          content: `This is a response to: "${content}"`,
          timestamp: new Date(),
          category: 'basic',
          suggestions: ['Follow-up question 1', 'Follow-up question 2']
        });
        
        // Re-render with updated messages
        mockHookImplementation.messages = [...mockMessages];
      });
      
      // Define the hook implementation with the updating messages
      const mockHookImplementation = {
        ...defaultMockHook,
        messages: mockMessages,
        sendMessage: mockSendMessage
      };
      
      (useInsuranceChat as jest.Mock).mockImplementation(() => mockHookImplementation);

      const { rerender } = render(<InsuranceChat />);
      
      // Find input and send button
      const input = screen.getByPlaceholder(/Ask me anything about insurance/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Send a message
      await act(async () => {
        fireEvent.change(input, { target: { value: 'What types of life insurance are there?' } });
        fireEvent.click(sendButton);
      });
      
      // Re-render with updated hook data
      rerender(<InsuranceChat />);
      
      // Should display user message
      expect(screen.getByText('What types of life insurance are there?')).toBeInTheDocument();
      
      // Should display assistant response
      expect(screen.getByText(/This is a response to: "What types of life insurance are there\?"/)).toBeInTheDocument();
      
      // Should show suggestions
      expect(screen.getByText('Follow-up question 1')).toBeInTheDocument();
      
      // Click a suggestion to continue conversation
      await act(async () => {
        fireEvent.click(screen.getByText('Follow-up question 1'));
      });
      
      // Re-render again
      rerender(<InsuranceChat />);
      
      // Should now have 4 messages (2 user + 2 assistant)
      expect(mockMessages.length).toBe(4);
      
      // Should display the new response
      expect(screen.getByText(/This is a response to: "Follow-up question 1"/)).toBeInTheDocument();
    });

    test('handles error and retry flow', async () => {
      let errorState: Error | null = new Error('Test error');
      const mockRetryLastMessage = jest.fn().mockImplementation(async () => {
        // Simulate successful retry
        errorState = null;
      });
      
      // Create a mock hook implementation with error
      const mockHookWithError = {
        ...defaultMockHook,
        error: errorState,
        retryLastMessage: mockRetryLastMessage
      };
      
      (useInsuranceChat as jest.Mock).mockImplementation(() => mockHookWithError);

      const { rerender } = render(<InsuranceChat />);
      
      // Should display error
      expect(screen.getByText('Test error')).toBeInTheDocument();
      
      // Find and click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      
      await act(async () => {
        fireEvent.click(retryButton);
      });
      
      // Should call retry function
      expect(mockRetryLastMessage).toHaveBeenCalled();
      
      // Update mock to show error cleared
      (useInsuranceChat as jest.Mock).mockImplementation(() => ({
        ...mockHookWithError,
        error: null
      }));
      
      rerender(<InsuranceChat />);
      
      // Error should be gone
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });
});

