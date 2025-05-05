import { InsuranceService } from '../services';
import { ResponseGenerator } from '../services/response-generator';
import { KnowledgeBase } from '../utils/knowledge-base';
import { logger } from '../utils/logger';
import { DEFAULT_INSURANCE_CONFIG } from '..';
import type { 
  InsuranceMessage, 
  QuestionCategory,
  KnowledgeBaseEntry 
} from '../types';

export interface ProcessMessageResponse {
  message: string;
  suggestions?: string[];
  category?: QuestionCategory;
}

/**
 * Middleware for processing insurance chat messages
 * Acts as an intermediary between the UI and the insurance services
 */
export class ChatMiddleware {
  private insuranceService: InsuranceService;
  private responseGenerator: ResponseGenerator;
  private knowledgeBase: KnowledgeBase;

  constructor() {
    this.insuranceService = new InsuranceService(DEFAULT_INSURANCE_CONFIG);
    this.knowledgeBase = new KnowledgeBase(); // This will be initialized with insurance knowledge
    this.responseGenerator = new ResponseGenerator(this.knowledgeBase);
  }

  /**
   * Processes an incoming message and generates a response
   * @param message The user message to process
   * @returns Processed response with suggestions
   */
  public async processMessage(message: string): Promise<ProcessMessageResponse> {
    try {
      logger.info('Processing message', 'ChatMiddleware', 'processMessage');
      
      // Categorize the question
      const category = await this.insuranceService.categorizeQuestion(message);
      
      // Get user context from previous messages (in a real implementation, this would maintain state)
      const userContext = this.extractUserContext(message, category);
      
      // Generate response using the response generator
      const response = await this.responseGenerator.generateResponse({
        userQuery: message,
        userData: userContext
      });
      
      return {
        message: response.message,
        suggestions: response.suggestions,
        category
      };
    } catch (error) {
      logger.error('Error processing message', 'ChatMiddleware', 'processMessage', error as Error);
      
      // Generate an error response
      const errorResponse = this.responseGenerator.generateErrorResponse(error as Error);
      
      return {
        message: errorResponse.message,
        suggestions: errorResponse.suggestions
      };
    }
  }

  /**
   * Extracts user context from the message to personalize responses
   */
  private extractUserContext(message: string, category: QuestionCategory): Record<string, any> {
    // Simple context extraction based on message content
    const context: Record<string, any> = {
      category
    };

    // Look for policy type mentions
    if (message.includes('term life')) {
      context.policyType = 'term';
    } else if (message.includes('whole life')) {
      context.policyType = 'whole';
    } else if (message.includes('universal life')) {
      context.policyType = 'universal';
    }

    // Look for coverage amount mentions
    const coverageMatch = message.match(/\$([0-9,]+)(?:k|K|thousand)|\$([0-9,]+)(?:m|M|million)|([0-9,]+) (?:thousand|million) dollars/);
    if (coverageMatch) {
      let amount = 0;
      
      if (coverageMatch[1]) { // Thousands format: $500k or $500thousand
        amount = parseFloat(coverageMatch[1].replace(/,/g, '')) * 1000;
      } else if (coverageMatch[2]) { // Millions format: $1M or $1million
        amount = parseFloat(coverageMatch[2].replace(/,/g, '')) * 1000000;
      } else if (coverageMatch[3]) { // Text format: 500 thousand dollars or 1 million dollars
        const value = parseFloat(coverageMatch[3].replace(/,/g, ''));
        amount = message.includes('million') ? value * 1000000 : value * 1000;
      }
      
      if (amount > 0) {
        context.coverageAmount = amount;
      }
    }

    return context;
  }

  /**
   * Generates suggestions based on the current conversation context
   */
  public generateSuggestions(category: QuestionCategory): string[] {
    const basicSuggestions = [
      "What types of life insurance are available?",
      "How much does life insurance typically cost?",
      "What factors affect my insurance premium?"
    ];

    const healthSuggestions = [
      "Do I need a medical exam for life insurance?",
      "How do pre-existing conditions affect my coverage?",
      "Can I get life insurance if I have diabetes?"
    ];

    const policySuggestions = [
      "What's the difference between term and whole life insurance?",
      "How do I file a claim?",
      "Can I modify my policy after purchase?"
    ];

    const claimsSuggestions = [
      "How long does the claims process take?",
      "What documents are needed for a claim?",
      "Are there situations where a claim might be denied?"
    ];

    switch (category) {
      case 'basic':
        return basicSuggestions;
      case 'health':
        return healthSuggestions;
      case 'policy':
        return policySuggestions;
      case 'claims':
        return claimsSuggestions;
      default:
        return basicSuggestions;
    }
  }
}

