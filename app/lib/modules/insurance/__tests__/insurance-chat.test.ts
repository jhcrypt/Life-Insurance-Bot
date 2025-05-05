import { renderHook, act } from '@testing-library/react-hooks';
import { useInsuranceChat } from '../../../hooks/useInsuranceChat';
import { ChatMiddleware } from '../middleware/chat-middleware';
import { InsuranceService } from '../services/insurance-service';
import { ResponseGenerator } from '../services/response-generator';
import { KnowledgeBase } from '../utils/knowledge-base';

// Mock the middleware's processMessage method
jest.mock('../middleware/chat-middleware', () => {
  return {
    ChatMiddleware: jest.fn().mockImplementation(() => {
      return {
        processMessage: jest.fn().mockImplementation(async (message: string) => {
          // Simulate different responses based on input for testing
          if (message === 'error') {
            throw new Error('Mock error');
          }
          
          if (message === 'term life') {
            return {
              message: 'Term life insurance provides coverage for a specific period.',
              category: 'basic',
              suggestions: ['How much does term life cost?', 'What happens when term expires?']
            };
          }
          
          return {
            message: 'I can help you with insurance questions.',
            category: 'basic',
            suggestions: ['Tell me about life insurance', 'How much coverage do I need?']
          };
        }),
        generateSuggestions: jest.fn().mockReturnValue([
          'What types of life insurance are available?',
          'How much coverage do I need?',
          'What factors affect my premium?'
        ])
      };
    })
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
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

describe('useInsuranceChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });
  
  describe('Basic Chat Functionality', () => {
    test('should initialize with empty messages', () => {
      const { result } = renderHook(() => useInsuranceChat());
      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
    
    test('should add user message and assistant response when sending a message', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useInsuranceChat());
      
      await act(async () => {
        await result.current.sendMessage('Hello');
        await waitForNextUpdate();
      });
      
      expect(result.current.messages.length).toBe(2);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Hello');
      expect(result.current.messages[1].role).toBe('assistant');
      expect(result.current.messages[1].content).toBe('I can help you with insurance questions.');
    });
    
    test('should set loading state while processing a message', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useInsuranceChat());
      
      await act(async () => {
        const sendPromise = result.current.sendMessage('Hello');
        // Check loading state is true during processing
        expect(result.current.isLoading).toBe(true);
        await sendPromise;
        await waitForNextUpdate();
      });
      
      // Check loading state is false after processing
      expect(result.current.isLoading).toBe(false);
    });
    
    test('should update suggestions after response', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useInsuranceChat());
      
      await act(async () => {
        await result.current.sendMessage('term life');
        await waitForNextUpdate();
      });
      
      expect(result.current.suggestions).toEqual([
        'How much does term life cost?', 
        'What happens when term expires?'
      ]);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle errors when sending messages', async () => {
      const onError = jest.fn();
      const { result, waitForNextUpdate } = renderHook(() => 
        useInsuranceChat({ onError })
      );
      
      await act(async () => {
        await result.current.sendMessage('error');
        await waitForNextUpdate();
      });
      
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Mock error');
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
    
    test('should continue functioning after an error', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useInsuranceChat());
      
      // First send a message that causes an error
      await act(async () => {
        await result.current.sendMessage('error');
        await waitForNextUpdate();
      });
      
      expect(result.current.error).not.toBeNull();
      
      // Then send a valid message
      await act(async () => {
        await result.current.sendMessage('Hello again');
        await waitForNextUpdate();
      });
      
      // Error should be cleared and new messages added
      expect(result.current.error).toBeNull();
      expect(result.current.messages.length).toBe(3); // user error + user hello + assistant
      expect(result.current.messages[2].role).toBe('assistant');
    });
    
    test('retryLastMessage should retry the last failed message', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useInsuranceChat());
      
      // Mock ChatMiddleware.processMessage to fail once then succeed
      const mockProcessMessage = ChatMiddleware.prototype.processMessage as jest.Mock;
      mockProcessMessage
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          message: 'Retry succeeded!',
          category: 'basic',
          suggestions: []
        });
      
      // Send a message that will fail
      await act(async () => {
        await result.current.sendMessage('test retry');
        await waitForNextUpdate();
      });
      
      expect(result.current.error).not.toBeNull();
      
      // Now retry the message
      await act(async () => {
        await result.current.retryLastMessage();
        await waitForNextUpdate();
      });
      
      // Check the retry was successful
      expect(result.current.error).toBeNull();
      expect(result.current.messages.length).toBe(2);
      expect(result.current.messages[1].content).toBe('Retry succeeded!');
    });
  });
  
  describe('Message Persistence', () => {
    test('should save messages to localStorage', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useInsuranceChat());
      
      await act(async () => {
        await result.current.sendMessage('Hello');
        await waitForNextUpdate();
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(JSON.parse(localStorageMock.setItem.mock.calls[0][1]).length).toBe(2);
    });
    
    test('should load messages from localStorage on initialization', () => {
      // Setup localStorage with existing messages
      const existingMessages = [
        {
          content: 'Previous question',
          role: 'user',
          timestamp: new Date().toISOString()
        },
        {
          content: 'Previous answer',
          role: 'assistant',
          timestamp: new Date().toISOString(),
          category: 'basic'
        }
      ];
      
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(existingMessages));
      
      const { result } = renderHook(() => useInsuranceChat());
      
      expect(result.current.messages.length).toBe(2);
      expect(result.current.messages[0].content).toBe('Previous question');
      expect(result.current.messages[1].content).toBe('Previous answer');
    });
    
    test('should clear messages from localStorage when resetting chat', async () => {
      const { result } = renderHook(() => useInsuranceChat());
      
      await act(async () => {
        await result.current.sendMessage('Hello');
        // Reset the chat
        result.current.resetChat();
      });
      
      expect(localStorageMock.removeItem).toHaveBeenCalled();
      expect(result.current.messages).toEqual([]);
    });
    
    test('should not persist messages when persistMessages is false', async () => {
      const { result, waitForNextUpdate } = renderHook(() => 
        useInsuranceChat({ persistMessages: false })
      );
      
      await act(async () => {
        await result.current.sendMessage('Hello');
        await waitForNextUpdate();
      });
      
      // Verify localStorage was not called
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
  
  describe('Insurance-Specific Features', () => {
    test('should handle insurance-specific queries correctly', async () => {
      // Mock specific response for insurance query
      const mockMiddleware = ChatMiddleware.prototype.processMessage as jest.Mock;
      mockMiddleware.mockResolvedValueOnce({
        message: 'Term life insurance provides coverage for a specific period, typically 10-30 years.',
        category: 'policy',
        suggestions: ['How much does term life cost?', 'What happens when term expires?']
      });
      
      const { result, waitForNextUpdate } = renderHook(() => useInsuranceChat());
      
      await act(async () => {
        await result.current.sendMessage('Tell me about term life insurance');
        await waitForNextUpdate();
      });
      
      expect(result.current.messages[1].category).toBe('policy');
      expect(result.current.messages[1].content).toContain('Term life insurance');
    });
    
    test('should maintain question categories in responses', async () => {
      // Setup sequence of different category responses
      const mockMiddleware = ChatMiddleware.prototype.processMessage as jest.Mock;
      mockMiddleware
        .mockResolvedValueOnce({
          message: 'Life insurance comes in several types.',
          category: 'basic',
          suggestions: []
        })
        .mockResolvedValueOnce({
          message: 'Medical exams are often required for traditional policies.',
          category: 'health',
          suggestions: []
        })
        .mockResolvedValueOnce({
          message: 'To file a claim, beneficiaries need to submit a death certificate.',
          category: 'claims',
          suggestions: []
        });
      
      const { result, waitForNextUpdate } = renderHook(() => useInsuranceChat());
      
      // Send multiple messages with different categories
      await act(async () => {
        await result.current.sendMessage('What types of life insurance are there?');
        await waitForNextUpdate();
      });
      
      expect(result.current.messages[1].category).toBe('basic');
      
      await act(async () => {
        await result.current.sendMessage('Do I need a medical exam?');
        await waitForNextUpdate();
      });
      
      expect(result.current.messages[3].category).toBe('health');
      
      await act(async () => {
        await result.current.sendMessage('How do I file a claim?');
        await waitForNextUpdate();
      });
      
      expect(result.current.messages[5].category).toBe('claims');
    });
    
    test('should handle context extraction from user queries', async () => {
      // Mock the middleware to validate context extraction
      const mockMiddleware = ChatMiddleware.prototype.processMessage as jest.Mock;
      
      mockMiddleware.mockImplementation(async (message: string) => {
        if (message.includes('$500,000')) {
          return {
            message: 'A $500,000 policy would provide good coverage for your needs.',
            category: 'policy',
            suggestions: []
          };
        }
        return {
          message: 'I can help with your insurance questions.',
          category: 'basic',
          suggestions: []
        };
      });
      
      const { result, waitForNextUpdate } = renderHook(() => useInsuranceChat());
      
      await act(async () => {
        await result.current.sendMessage('I want a $500,000 term life policy');
        await waitForNextUpdate();
      });
      
      expect(result.current.messages[1].content).toContain('$500,000');
      expect(mockMiddleware).toHaveBeenCalledWith('I want a $500,000 term life policy');
    });
  });
});

