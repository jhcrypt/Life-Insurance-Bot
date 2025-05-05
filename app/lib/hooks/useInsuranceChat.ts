import { useState, useCallback, useRef, useEffect } from 'react';
import { InsuranceService } from '../modules/insurance/services/insurance-service';
import { QuestionCategory, InsuranceServiceConfig, DEFAULT_INSURANCE_CONFIG } from '../modules/insurance/types';
import { createScopedLogger } from '~/utils/logger';
import type { IProviderSetting } from '~/types/model';
import type { KnowledgeBaseEntry } from '../modules/insurance/types';

const logger = createScopedLogger('useInsuranceChat');

export interface InsuranceMessage {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  category?: QuestionCategory;
  suggestions?: string[];
}

export interface UseInsuranceChatOptions {
  onError?: (error: Error) => void;
  initialMessages?: InsuranceMessage[];
  persistMessages?: boolean;
  config?: Partial<InsuranceServiceConfig>;
  apiKeys?: Record<string, string>;
  providerSettings?: Record<string, IProviderSetting>;
}

export interface UseInsuranceChatReturn {
  messages: InsuranceMessage[];
  isLoading: boolean;
  error: Error | null;
  suggestions: string[];
  sendMessage: (content: string) => Promise<void>;
  resetChat: () => void;
  retryLastMessage: () => Promise<void>;
  searchKnowledgeBase: (query: string) => KnowledgeBaseEntry[];
  setModelOverride: (modelName: string | undefined) => void;
}

const LOCAL_STORAGE_KEY = 'insurance-chat-history';

/**
 * Hook for managing insurance chat state and interactions
 */
export function useInsuranceChat(options: UseInsuranceChatOptions = {}): UseInsuranceChatReturn {
  const {
    onError,
    initialMessages = [],
    persistMessages = true,
    config = {},
    apiKeys = {},
    providerSettings = {}
  } = options;
  
  // Chat state
  const [messages, setMessages] = useState<InsuranceMessage[]>(() => {
    // Try to load messages from local storage if persistMessages is true
    if (persistMessages && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Convert timestamp strings back to Date objects
          return parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        }
      } catch (err) {
        logger.error('Failed to load chat history from local storage', err instanceof Error ? err : new Error(String(err)));
      }
    }
    
    return initialMessages;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [modelOverride, setModelOverride] = useState<string | undefined>(undefined);
  
  // Initialize the InsuranceService with merged config
  const serviceConfig = {
    ...DEFAULT_INSURANCE_CONFIG,
    ...config
  };
  
  // Refs for services to avoid recreation on each render
  const serviceRef = useRef<InsuranceService>(new InsuranceService(serviceConfig));
  const lastMessageRef = useRef<string>('');
  const contextRef = useRef<Record<string, any>>({});
  
  // Persist messages to local storage when they change
  useEffect(() => {
    if (persistMessages && typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
      } catch (err) {
        logger.error('Failed to save chat history to local storage', err instanceof Error ? err : new Error(String(err)));
      }
    }
  }, [messages, persistMessages]);
  
  /**
   * Processes a user message and adds both user message and response to chat
   */
  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true);
      setError(null);
      lastMessageRef.current = content;
      
      logger.info('Processing message');
      
      // Add user message to chat
      const userMessage: InsuranceMessage = {
        content,
        role: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // First, categorize the question to understand the context
      const category = await serviceRef.current.categorizeQuestion(content);
      
      // Extract context for potential future use
      const extractedContext = serviceRef.current.extractContextFromQuery?.(content, category) || {};
      contextRef.current = {
        ...contextRef.current,
        ...extractedContext
      };
      
      // Process message through the service
      const response = await serviceRef.current.processQuery(
        content,
        modelOverride,
        apiKeys,
        providerSettings
      );
      
      // Generate follow-up suggestions based on the message and category
      const followUpSuggestions = serviceRef.current.generateFollowUpQuestions(category, content);
      
      // Add assistant response to chat
      const assistantMessage: InsuranceMessage = {
        content: response,
        role: 'assistant',
        timestamp: new Date(),
        category: category,
        suggestions: followUpSuggestions
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update suggestions
      if (followUpSuggestions && followUpSuggestions.length > 0) {
        setSuggestions(followUpSuggestions);
      } else {
        // If no suggestions, use defaults or clear
        setSuggestions([]);
      }
      
      logger.info('Message processed successfully');
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to process message');
      logger.error('Error processing message', error);
      setError(error);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onError, modelOverride, apiKeys, providerSettings]);
  
  /**
   * Resets the chat to its initial state
   */
  const resetChat = useCallback(() => {
    logger.info('Resetting chat');
    setMessages(initialMessages);
    setError(null);
    setSuggestions([]);
    setModelOverride(undefined);
    lastMessageRef.current = '';
    contextRef.current = {};
    
    // Clear local storage if we're persisting messages
    if (persistMessages && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (err) {
        logger.error('Failed to clear chat history from local storage', err instanceof Error ? err : new Error(String(err)));
      }
    }
  }, [initialMessages, persistMessages]);
  
  /**
   * Retries sending the last user message
   */
  const retryLastMessage = useCallback(async () => {
    if (lastMessageRef.current) {
      const lastMessage = lastMessageRef.current;
      
      // Remove the last assistant message if it exists
      setMessages(prev => {
        // Find the last user message to determine where to cut
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].role === 'user') {
            // Return everything up to and including this user message
            return prev.slice(0, i + 1

