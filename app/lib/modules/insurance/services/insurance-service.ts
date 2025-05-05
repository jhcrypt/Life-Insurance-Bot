import { KnowledgeBase, findPolicyType, findTerm } from '../utils/knowledge-base';
import { QuestionCategory, InsuranceServiceConfig } from '../types';
import { DEFAULT_INSURANCE_CONFIG } from '..';
import { ResponseGenerator } from './response-generator';
import { LLMManager } from '~/lib/modules/llm/manager';
import type { LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';

// Create a scoped logger for the insurance service
const logger = createScopedLogger('InsuranceService');

/**
 * Core service for handling insurance-related operations
 * Integrates with Bolt's AI provider system
 */
export class InsuranceService {
  private config: InsuranceServiceConfig;
  private knowledgeBase: KnowledgeBase;
  private responseGenerator: ResponseGenerator;
  private llmManager: LLMManager;

  /**
   * Creates a new InsuranceService with the specified configuration
   * @param config Configuration for the service
   */
  constructor(config: InsuranceServiceConfig = DEFAULT_INSURANCE_CONFIG) {
    this.config = config;
    this.knowledgeBase = new KnowledgeBase();
    this.responseGenerator = new ResponseGenerator(this.knowledgeBase);
    this.llmManager = LLMManager.getInstance();
    
    logger.info(`InsuranceService initialized with model: ${config.model}, temperature: ${config.temperature}`);
  }

  /**
   * Gets a language model instance using the configured provider and model
   * @param modelName Name of the model to use
   * @param apiKeys API keys for providers
   * @param providerSettings Provider-specific settings
   * @returns Language model instance
   */
  private getLanguageModel(
    modelName: string = this.config.model,
    apiKeys?: Record<string, string>,
    providerSettings?: Record<string, IProviderSetting>
  ): LanguageModelV1 {
    try {
      // Find the model in the available models
      const modelList = this.llmManager.getModelList();
      const modelInfo = modelList.find(model => model.name === modelName);
      
      if (!modelInfo) {
        logger.warn(`Model ${modelName} not found, using default provider`);
        const defaultProvider = this.llmManager.getDefaultProvider();
        return defaultProvider.getModelInstance({
          model: defaultProvider.staticModels[0].name,
          serverEnv: process.env,
          apiKeys,
          providerSettings
        });
      }
      
      // Get the provider for this model
      const provider = this.llmManager.getProvider(modelInfo.provider);
      
      if (!provider) {
        throw new Error(`Provider ${modelInfo.provider} not found for model ${modelName}`);
      }
      
      // Get the model instance
      return provider.getModelInstance({
        model: modelName,
        serverEnv: process.env,
        apiKeys,
        providerSettings
      });
    } catch (error) {
      logger.error(`Error getting language model: ${error instanceof Error ? error.message : String(error)}`);
      
      // Fallback to default OpenAI model if available
      const openAIProvider = this.llmManager.getProvider('OpenAI');
      if (openAIProvider) {
        return openAIProvider.getModelInstance({
          model: 'gpt-3.5-turbo',
          serverEnv: process.env,
          apiKeys,
          providerSettings
        });
      }
      
      throw new Error(`Failed to get language model and no fallback available: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  /**
   * Processes a user query and generates a response
   * @param query The user's question or prompt
   * @param modelOverride Optional model override
   * @param apiKeys API keys for providers
   * @param providerSettings Provider-specific settings
   * @returns A response to the query
   */
  public async processQuery(
    query: string, 
    modelOverride?: string,
    apiKeys?: Record<string, string>,
    providerSettings?: Record<string, IProviderSetting>
  ): Promise<string> {
    try {
      logger.info('Processing query');
      
      // Categorize the question first
      const category = await this.categorizeQuestion(query);
      
      // Extract context from the query
      const context = this.extractContextFromQuery(query, category);
      
      // Use AI model for enhanced response generation
      if (modelOverride || this.config.useAI !== false) {
        try {
          // Get the language model
          const model = this.getLanguageModel(
            modelOverride || this.config.model,
            apiKeys,
            providerSettings
          );
          
          // Generate an insurance-specific prompt
          const prompt = this.generateInsurancePrompt(query, context);
          
          // Get response from the language model
          try {
            const completion = await model.complete({
              prompt,
              temperature: this.config.temperature,
              maxTokens: this.config.maxTokens
            });
            
            // Enhance the AI response with knowledge base information
            const enhancedResponse = await this.enhanceResponseWithKnowledgeBase(
              completion.text,
              query,
              context,
              category
            );
            
            return enhancedResponse;
          } catch (modelError) {
            logger.error(`Error from language model: ${modelError instanceof Error ? modelError.message : String(modelError)}`);
            throw modelError; // Re-throw to be caught by the outer try/catch
          }
        } catch (aiError) {
          // If we encounter an error with the AI model, fall back to knowledge base
          logger.warn(`Falling back to knowledge base due to AI error: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
          
          // Generate response using the response generator
          const response = await this.responseGenerator.generateResponse({
            userQuery: query,
            userData: context
          });
          
          return response.message;
        }
      } else {
        // If AI is disabled, use the knowledge base directly
        logger.info('AI is disabled, using knowledge base directly');
        
        // Generate response using the response generator
        const response = await this.responseGenerator.generateResponse({
          userQuery: query,
          userData: context
        });
        
        return response.message;
      }
    } catch (error) {
      logger.error(`Error processing query: ${error instanceof Error ? error.message : String(error)}`);
      return `Sorry, I'm having trouble answering that question about insurance. Please try rephrasing it or ask something else.`;
    }
  }
  
  /**
   * Categorizes a question into different insurance domains
   * @param question The question to categorize
   * @returns The category of the question
   */
  public async categorizeQuestion(question: string): Promise<QuestionCategory> {
    try {
      const lowerQuestion = question.toLowerCase();
      
      // Check for health-related keywords
      if (
        lowerQuestion.includes('health') ||
        lowerQuestion.includes('medical') ||
        lowerQuestion.includes('exam') ||
        lowerQuestion.includes('pre-existing') ||
        lowerQuestion.includes('condition') ||
        lowerQuestion.includes('diabetes') ||
        lowerQuestion.includes('smoker')
      ) {
        return 'health';
      }
      
      // Check for claims-related keywords
      if (
        lowerQuestion.includes('claim') ||
        lowerQuestion.includes('file') ||
        lowerQuestion.includes('beneficiary payout') ||
        lowerQuestion.includes('death certificate') ||
        lowerQuestion.includes('process claim')
      ) {
        return 'claims';
      }
      
      // Check for policy-specific keywords
      if (
        lowerQuestion.includes('policy') ||
        lowerQuestion.includes('coverage') ||
        lowerQuestion.includes('premium') ||
        lowerQuestion.includes('cash value') ||
        lowerQuestion.includes('term') ||
        lowerQuestion.includes('whole life') ||
        lowerQuestion.includes('universal') ||
        lowerQuestion.includes('variable') ||
        lowerQuestion.includes('permanent')
      ) {
        return 'policy';
      }
      
      // Default to basic category for general questions
      return 'basic';
    } catch (error) {
      logger.error(`Error categorizing question: ${error instanceof Error ? error.message : String(error)}`);
      return 'basic'; // Default to basic category on error
    }
  }
  
  /**
   * Extracts context from a query to provide more personalized responses
   * @param query The user query
   * @param category The determined question category
   * @returns Context object with extracted information
   */
  private extractContextFromQuery(query: string, category: QuestionCategory): Record<string, any> {
    const context: Record<string, any> = { category };
    
    // Extract potential policy type mentions
    if (query.toLowerCase().includes('term life')) {
      context.policyType = 'term';
    } else if (query.toLowerCase().includes('whole life')) {
      context.policyType = 'whole';
    } else if (query.toLowerCase().includes('universal life')) {
      context.policyType = 'universal';
    } else if (query.toLowerCase().includes('variable life')) {
      context.policyType = 'variable';
    }
    
    // Extract potential coverage amounts
    const coverageMatch = query.match(/\$([0-9,]+)(?:k|K|thousand)|\$([0-9,]+)(?:m|M|million)|([0-9,]+) (?:thousand|million) dollars/);
    if (coverageMatch) {
      let amount = 0;
      
      if (coverageMatch[1]) { // Thousands format: $500k or $500thousand
        amount = parseFloat(coverageMatch[1].replace(/,/g, '')) * 1000;
      } else if (coverageMatch[2]) { // Millions format: $1M or $1million
        amount = parseFloat(coverageMatch[2].replace(/,/g, '')) * 1000000;
      } else if (coverageMatch[3]) { // Text format: 500 thousand dollars or 1 million dollars
        const value = parseFloat(coverageMatch[3].replace(/,/g, ''));
        amount = query.includes('million') ? value * 1000000 : value * 1000;
      }
      
      if (amount > 0) {
        context.coverageAmount = amount;
      }
    }
    
    // Extract potential age references
    const ageMatch = query.match(/\b(\d{1,2})\s*(?:years?\s*old|year-old|yo)\b/);
    if (ageMatch && ageMatch[1]) {
      const age = parseInt(ageMatch[1], 10);
      if (age > 0 && age < 120) { // Basic validation
        context.age = age;
      }
    }
    
    // Extract health status indicators
    if (
      query.toLowerCase().includes('diabetes') ||
      query.toLowerCase().includes('high blood pressure') ||
      query.toLowerCase().includes('heart condition')
    ) {
      context.healthStatus = 'pre-existing condition';
    } else if (
      query.toLowerCase().includes('smoker') ||
      query.toLowerCase().includes('smoke cigarettes')
    ) {
      context.healthStatus = 'smoker';
    } else if (
      query.toLowerCase().includes('excellent health') ||
      query.toLowerCase().includes('good health')
    ) {
      context.healthStatus = 'good health';
    }
    
    return context;
  }
  
  /**
   * Generates an insurance-specific prompt for AI models
   */
  private generateInsurancePrompt(query: string, context: Record<string, any>): string {
    // Create a system prompt that guides the AI to respond as an insurance expert
    const systemPrompt = `You are an expert insurance advisor specializing in life and health insurance. 
Provide helpful, accurate, and concise responses about insurance topics.
Base your responses on factual information about insurance products, policies, and industry standards.
Always maintain a professional and supportive tone.

${context.policyType ? `The user is asking about ${context.policyType} life insurance.` : ''}
${context.coverageAmount ? `The user is interested in coverage around $${context.coverageAmount.toLocaleString()}.` : ''}
${context.healthStatus ? `The user has mentioned ${context.healthStatus} as a health consideration.` : ''}
${context.age ? `The user is ${context.age} years old.` : ''}

Current conversation category: ${context.category || 'basic'}`;

    // Combine system prompt with the user query
    return `${systemPrompt}\n\nUser: ${query}\n\nAssistant:`;
  }
  
  /**
   * Enhances an AI response with information from the knowledge base
   */
  private async enhanceResponseWithKnowledgeBase(
    aiResponse: string,
    query: string,
    context: Record<string, any>,
    category: QuestionCategory
  ): Promise<string> {
    try {
      // Get relevant information from the knowledge base
      const relevantInfo = this.knowledgeBase.findRelevantInformation(query);
      
      if (!relevantInfo || relevantInfo === '') {
        // If no relevant information found, return the AI response as is
        return aiResponse;
      }
      
      // If we have a policy type in the context, get specific information about it
      let policyInfo = null;
      if (context.policyType) {
        policyInfo = findPolicyType(context.policyType);
      }
      
      // Combine AI response with knowledge base information
      let enhancedResponse = aiResponse;
      
      // Only add additional information if it's not already covered in the AI response
      if (policyInfo && !aiResponse.toLowerCase().includes(policyInfo.description.toLowerCase())) {
        enhancedResponse += `\n\nAdditional information: ${policyInfo.description}`;
      } else if (relevantInfo && !aiResponse.toLowerCase().includes(relevantInfo.toLowerCase())) {
        enhancedResponse += `\n\nAdditional information: ${relevantInfo}`;
      }
      
      return enhancedResponse;
    } catch (error) {
      logger.warn(`Error enhancing response with knowledge base: ${error instanceof Error ? error.message : String(error)}`);
      // Return the original AI response if enhancement fails
      return aiResponse;
    }
  }
  
  /**
   * Gets information about a specific policy type
   * @param policyType The type of policy to get information for
   * @returns Information about the policy
   */
  public getPolicyInformation(policyType: string): Record<string, any> | null {
    try {
      const policyInfo = findPolicyType(policyType);
      return policyInfo || null;
    } catch (error) {
      logger.error(`Error getting policy information: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  
  /**
   * Gets the definition of an insurance term
   * @param term The term to define
   * @returns The definition of the term
   */
  public getTermDefinition(term: string): string | null {
    try {
      const termInfo = findTerm(term);
      return termInfo ? termInfo.definition : null;
    } catch (error) {
      logger.error(`Error getting term definition: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  
  /**
   * Searches the knowledge base for information related to a query
   * @param query The search query
   * @returns Relevant knowledge base entries
   */
  public searchKnowledgeBase(query: string): any[] {
    try {
      return this.knowledgeBase.search(query);
    } catch (error) {
      logger.error(`Error searching knowledge base: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Generates common follow-up questions based on the current conversation
   * @param category The category of the current question
   * @param query The current query for context
   * @returns An array of suggested follow-up questions
   */
  public generateFollowUpQuestions(category: QuestionCategory, query: string): string[] {
    try {
      // Get relevant topics based on the query
      const relatedTopics = this.knowledgeBase.getRelatedTopics(query);
      
      // Generate follow-up questions based on related topics
      const topicQuestions = relatedTopics.map(topic => `What can you tell me about ${topic}?`);
      
      // Generate category-specific follow-up questions
      const categoryQuestions: string[] = [];
      
      switch (category) {
        case 'basic':
          categoryQuestions.push(
            'What types of life insurance are available?',
            'How much coverage do I need?',
            'What affects my insurance premium cost?'
          );
          break;
        case 'health':
          categoryQuestions.push(
            'How do health conditions affect my coverage?',
            'Do I need a medical exam for insurance?',
            'Can I get insurance with pre-existing conditions?'
          );
          break;
        case 'policy':
          categoryQuestions.push(
            'What\'s the difference between term and whole life?',
            'Can I modify my policy after purchase?',
            'How do premiums change over time?'
          );
          break;
        case 'claims':
          categoryQuestions.push(
            'What documents are needed for a claim?',
            'How long does the claims process take?',
            'Who can file a claim?'
          );
          break;
      }
      
      // Combine and deduplicate questions, prioritizing topic-specific ones
      const allQuestions = [...topicQuestions, ...categoryQuestions];
      const uniqueQuestions = Array.from(new Set(allQuestions));
      
      // Return up to 3 suggestions
      return uniqueQuestions.slice(0, 3);
    } catch (error) {
      logger.error(`Error generating follow-up questions: ${error instanceof Error ? error.message : String(error)}`);
      return [
        'What types of insurance are you interested in?',
        'Do you have any specific coverage needs?',
        'Would you like to learn about term or whole life insurance?'
      ];
    }
  }
}

