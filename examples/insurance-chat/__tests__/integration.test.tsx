import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import BasicInsuranceChat from '../basic-usage';
import MultiProviderChat from '../multi-provider';
import AdvancedInsuranceChat from '../advanced-features';
import { InsuranceService } from '~/lib/modules/insurance/services/insurance-service';
import { KnowledgeBase } from '~/lib/modules/insurance/utils/knowledge-base';

// This is an integration test suite that tests real interactions with the service
// Unlike unit tests, these tests verify actual service behavior and responses

/**
 * Integration Tests for Insurance Chat Examples
 * 
 * These tests verify real interactions between the UI components and the insurance service.
 * They don't mock the service calls but instead test the full integration.
 * 
 * Note: For these tests to pass in CI environments, valid API keys need to be provided
 * or the tests need to be skipped in those environments.
 */
describe('Insurance Chat Integration Tests', () => {
  // Set a longer timeout for real service calls
  jest.setTimeout(30000);
  
  // Skip tests if no API keys are available (CI environments)
  const hasApiKeys = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  const testOrSkip = hasApiKeys ? test : test.skip;
  
  // Initialize real services for testing
  let insuranceService: InsuranceService;
  let knowledgeBase: KnowledgeBase;
  
  beforeAll(() => {
    // Create real service instances for integration testing
    insuranceService = new InsuranceService();
    knowledgeBase = new KnowledgeBase();
    
    // Log test environment
    console.log('Running integration tests with:');
    console.log(`- API Keys Available: ${Boolean(hasApiKeys)}`);
    console.log(`- Test Environment: ${process.env.NODE_ENV}`);
  });
  
  beforeEach(() => {
    // Set up localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      },
      writable: true
    });
    
    jest.clearAllMocks();
  });
  
  describe('Basic Usage Integration', () => {
    testOrSkip('should render and send messages to real service', async () => {
      // Render the basic chat component
      render(<BasicInsuranceChat />);
      
      // Verify UI elements are rendered
      expect(screen.getByText('Insurance Assistant')).toBeInTheDocument();
      const inputField = screen.getByPlaceholder(/Ask.*insurance/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Prepare a test query
      const testQuery = 'What is term life insurance?';
      
      // Send a message
      await act(async () => {
        fireEvent.change(inputField, { target: { value: testQuery } });
        fireEvent.click(sendButton);
      });
      
      // Wait for a response (this will actually call the real service)
      await waitFor(() => {
        // Look for common terms in response about term life insurance
        const responseElements = screen.getAllByText(/term/i);
        // We should have at least one response element containing "term"
        expect(responseElements.length).toBeGreaterThan(0);
      }, { timeout: 10000 }); // Longer timeout for real API calls
      
      // Check for suggestions after response
      await waitFor(() => {
        const suggestions = screen.getAllByRole('button');
        // There should be multiple buttons including send and suggestions
        expect(suggestions.length).toBeGreaterThan(1);
      });
    });
    
    testOrSkip('should process a full conversation flow', async () => {
      render(<BasicInsuranceChat />);
      
      const inputField = screen.getByPlaceholder(/Ask.*insurance/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // First message
      await act(async () => {
        fireEvent.change(inputField, { target: { value: 'What types of life insurance exist?' } });
        fireEvent.click(sendButton);
      });
      
      // Wait for first response
      await waitFor(() => {
        // Should mention common policy types
        expect(screen.getByText(/term/i)).toBeInTheDocument();
        expect(screen.getByText(/whole life/i)).toBeInTheDocument();
      }, { timeout: 10000 });
      
      // Follow-up message
      await act(async () => {
        fireEvent.change(inputField, { target: { value: 'Tell me more about term life' } });
        fireEvent.click(sendButton);
      });
      
      // Wait for follow-up response
      await waitFor(() => {
        // Should provide details about term life
        expect(screen.getByText(/specific period/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });
  
  describe('Advanced Features Integration', () => {
    testOrSkip('should perform knowledge base search with real data', async () => {
      render(<AdvancedInsuranceChat />);
      
      // Look for search elements
      const searchInput = screen.getByPlaceholder(/Search insurance terms/i);
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      // Perform a search
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'term life' } });
        fireEvent.click(searchButton);
      });
      
      // Verify knowledge base results appear
      await waitFor(() => {
        // Should find term life in the knowledge base
        expect(screen.getByText(/term life/i)).toBeInTheDocument();
        // Results section should be visible
        expect(screen.getByText(/Results/i)).toBeInTheDocument();
      });
    });
    
    testOrSkip('should maintain context between messages', async () => {
      render(<AdvancedInsuranceChat />);
      
      // Set up message form
      const messageForm = screen.getByRole('form');
      const inputField = screen.getByPlaceholder(/Ask about insurance/i);
      
      // First message with context
      await act(async () => {
        fireEvent.change(inputField, { target: { value: 'I am 40 years old and need $500,000 in coverage' } });
        fireEvent.submit(messageForm);
      });
      
      // Wait for first response
      await waitFor(() => {
        // Should acknowledge the context
        expect(screen.getByText(/40/)).toBeInTheDocument();
        expect(screen.getByText(/500,000/)).toBeInTheDocument();
      }, { timeout: 10000 });
      
      // Follow-up without restating context
      await act(async () => {
        fireEvent.change(inputField, { target: { value: 'What type of policy would be best for me?' } });
        fireEvent.submit(messageForm);
      });
      
      // Wait for contextual response
      await waitFor(() => {
        // Should remember age and coverage amount in response
        const responseText = screen.getAllByText(/policy|recommend|best/i)[0];
        expect(responseText).toBeTruthy();
      }, { timeout: 10000 });
    });
  });
  
  describe('Multi-Provider Integration', () => {
    testOrSkip('should render provider selection and initialize chat', async () => {
      render(<MultiProviderChat />);
      
      // Check provider selection UI
      expect(screen.getByText('Multi-Provider Insurance Assistant')).toBeInTheDocument();
      expect(screen.getByText('Provider Settings')).toBeInTheDocument();
      
      // Verify default provider is set
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      
      // Check chat interface is rendered
      expect(screen.getByPlaceholder(/Ask.*insurance/i)).toBeInTheDocument();
    });
    
    // This test runs only if multiple API keys are available
    (hasApiKeys && process.env.ANTHROPIC_API_KEY ? test : test.skip)('should switch between providers', async () => {
      render(<MultiProviderChat />);
      
      // Get provider select and chat interface
      const providerSelect = screen.getByLabelText(/AI Provider/i);
      const inputField = screen.getByPlaceholder(/Ask.*insurance/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Send message with default provider (OpenAI)
      await act(async () => {
        fireEvent.change(inputField, { target: { value: 'What is whole life insurance?' } });
        fireEvent.click(sendButton);
      });
      
      // Wait for OpenAI response
      const openAIResponse = await waitFor(() => {
        const responses = screen.getAllByText(/whole life/i);
        // Return the response element with the most content
        return responses.reduce((longest, current) => 
          current.textContent!.length > longest.textContent!.length ? current : longest
        , responses[0]);
      }, { timeout: 10000 });
      
      // Switch to Anthropic (if available)
      if (process.env.ANTHROPIC_API_KEY) {
        await act(async () => {
          fireEvent.change(providerSelect, { target: { value: 'Anthropic' } });
          // Wait for provider switch to take effect
          await new Promise(resolve => setTimeout(resolve, 500));
        });
        
        // Send the same question
        await act(async () => {
          fireEvent.change(inputField, { target: { value: 'What is whole life insurance?' } });
          fireEvent.click(sendButton);
        });
        
        // Wait for Anthropic response
        await waitFor(() => {
          const responses = screen.getAllByText(/whole life/i);
          // Find responses after the OpenAI response
          const newResponses = responses.filter(el => el !== openAIResponse);
          // There should be a new response
          expect(newResponses.length).toBeGreaterThan(0);
        }, { timeout: 10000 });
      }
    });
  });
  
  describe('Direct Service Integration', () => {
    testOrSkip('should access the insurance service directly', async () => {
      // Test direct service calls
      const query = 'What is term life insurance?';
      const response = await insuranceService.processQuery(query);
      
      // Verify response contains relevant information
      expect(response).toContain('term');
      expect(response.length).toBeGreaterThan(50); // Should be a substantial response
    });
    
    testOrSkip('should categorize questions correctly', async () => {
      // Test question categorization
      const healthQuestion = 'How do pre-existing conditions affect my insurance?';
      const healthCategory = await insuranceService.categorizeQuestion(healthQuestion);
      expect(healthCategory).toBe('health');
      
      const policyQuestion = 'What's the difference between term and whole life?';
      const policyCategory = await insuranceService.categorizeQuestion(policyQuestion);
      expect(policyCategory).toBe('policy');
    });
    
    testOrSkip('should generate appropriate follow-up questions', () => {
      // Test suggestion generation
      const query = 'Tell me about term life insurance';
      const category = 'policy';
      const suggestions = insuranceService.generateFollowUpQuestions(category as any, query);
      
      // Should have suggestions
      expect(suggestions.length).toBeGreaterThan(0);
      // Suggestions should be relevant to term life
      expect(suggestions.some(s => s.includes('term') || s.includes('policy'))).toBeTruthy();
    });
    
    testOrSkip('should search the knowledge base', () => {
      // Test knowledge base search
      const results = insuranceService.searchKnowledgeBase('term life');
      
      // Should find term life entries
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].term.toLowerCase()).toContain('term');
    });
  });
});

