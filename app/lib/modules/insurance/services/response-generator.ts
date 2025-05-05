import { KnowledgeBase, findPolicyType, findTerm, getResponseTemplate, commonQuestions } from '../utils/knowledge-base';
import { QuestionCategory } from '../types';
import { logger } from '../utils/logger';

interface ResponseContext {
    userQuery: string;
    previousMessages?: string[];
    userData?: {
        policyType?: string;
        coverageAmount?: number;
        healthStatus?: string;
        category?: QuestionCategory;
    };
}

interface FormattedResponse {
    message: string;
    suggestions?: string[];
    relatedTopics?: string[];
    confidence: number;
}

export class ResponseGenerator {
    private knowledgeBase: KnowledgeBase;

    constructor(knowledgeBase: KnowledgeBase) {
        this.knowledgeBase = knowledgeBase;
    }

    /**
     * Generates a response based on the query and context
     */
    public async generateResponse(context: ResponseContext): Promise<FormattedResponse> {
        try {
            const { userQuery, previousMessages, userData } = context;
            
            // Analyze query intent
            const intent = await this.analyzeIntent(userQuery);
            
            // Get relevant knowledge base entries
            const relevantInfo = this.knowledgeBase.findRelevantInformation(intent);
            
            // Apply context to response
            const contextualizedResponse = this.applyContext(
                relevantInfo,
                previousMessages,
                userData
            );
            
            // Format the response
            return this.formatResponse(contextualizedResponse, userData?.category);
        } catch (error) {
            logger.error('Error generating response', 'ResponseGenerator', 'generateResponse', error as Error);
            return this.generateErrorResponse(error as Error);
        }
    }

    /**
     * Analyzes the intent of the user query
     */
    private async analyzeIntent(query: string): Promise<string> {
        // Simple intent analysis based on keywords
        const lowerQuery = query.toLowerCase();
        
        if (lowerQuery.includes('term life') || lowerQuery.includes('whole life') || 
            lowerQuery.includes('universal life') || lowerQuery.includes('variable life')) {
            return 'policy_explanation';
        }

        if (lowerQuery.includes('premium') || lowerQuery.includes('cash value') || 
            lowerQuery.includes('beneficiary') || lowerQuery.includes('underwriting')) {
            return 'term_definition';
        }

        if (lowerQuery.includes('how much') || lowerQuery.includes('coverage') || 
            lowerQuery.includes('amount')) {
            return 'coverage_question';
        }

        if (lowerQuery.includes('health') || lowerQuery.includes('medical') || 
            lowerQuery.includes('exam') || lowerQuery.includes('pre-existing')) {
            return 'health_question';
        }

        if (lowerQuery.includes('claim') || lowerQuery.includes('file') || 
            lowerQuery.includes('process')) {
            return 'claims_question';
        }

        return 'general_insurance_query';
    }

    /**
     * Applies user context and conversation history to the response
     */
    private applyContext(
        baseResponse: string,
        previousMessages?: string[],
        userData?: Record<string, any>
    ): string {
        let response = baseResponse;

        // Apply user data if available
        if (userData) {
            Object.entries(userData).forEach(([key, value]) => {
                const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                response = response.replace(placeholder, String(value));
            });
        }

        // Personalize based on coverage amount if available
        if (userData?.coverageAmount) {
            const amount = userData.coverageAmount;
            const formattedAmount = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
            }).format(amount);
            
            response = response.replace(/\{\{coverageAmount\}\}/g, formattedAmount);
            
            // Add personalized coverage context
            if (response.includes('coverage') || response.includes('policy')) {
                response = response.replace(/\b(your coverage|your policy)\b/g, `your ${formattedAmount} coverage`);
            }
        }

        // Personalize based on policy type if available
        if (userData?.policyType) {
            const policyType = userData.policyType;
            const policyInfo = findPolicyType(policyType);
            
            if (policyInfo) {
                // Enhance with policy-specific details
                response = this.enhanceWithPolicyDetails(response, policyInfo);
            }
        }

        // Consider conversation history for context continuity
        if (previousMessages?.length) {
            // Look for references to previous topics
            const lastTwoMessages = previousMessages.slice(-2);
            const referencesTerms = lastTwoMessages.some(msg => 
                ['this', 'that', 'it', 'these', 'those'].some(ref => 
                    msg.toLowerCase().includes(ref)
                )
            );
            
            if (referencesTerms) {
                // Extract potential terms from previous messages
                const potentialTerms = this.extractTermsFromMessages(lastTwoMessages);
                if (potentialTerms.length > 0) {
                    response = this.enrichResponseWithTerms(response, potentialTerms);
                }
            }
        }

        return response;
    }

    /**
     * Extracts insurance terms from messages
     */
    private extractTermsFromMessages(messages: string[]): string[] {
        const terms: string[] = [];
        const allTerms = this.knowledgeBase.getAllTerms();
        
        for (const message of messages) {
            for (const term of allTerms) {
                if (message.toLowerCase().includes(term.toLowerCase())) {
                    terms.push(term);
                }
            }
        }
        
        return [...new Set(terms)]; // Remove duplicates
    }

    /**
     * Enriches response with related terms
     */
    private enrichResponseWithTerms(response: string, terms: string[]): string {
        if (terms.length === 0) return response;
        
        // Add context from the first term if it's not already in the response
        const term = terms[0];
        const termInfo = findTerm(term);
        
        if (termInfo && !response.toLowerCase().includes(termInfo.term.toLowerCase())) {
            return `Regarding ${termInfo.term}, ${response}`;
        }
        
        return response;
    }

    /**
     * Enhances response with policy details
     */
    private enhanceWithPolicyDetails(response: string, policyInfo: any): string {
        // If response doesn't already contain detailed policy information
        if (!response.includes(policyInfo.description)) {
            if (response.includes('features') && !response.includes(policyInfo.features.join())) {
                // Replace generic features placeholder with actual features
                response = response.replace(
                    /\{\{features\}\}/g, 
                    policyInfo.features.join(", ")
                );
            }
            
            if (response.includes('best for') && !response.includes(policyInfo.bestFor.join())) {
                // Replace generic best for placeholder with actual recommendations
                response = response.replace(
                    /\{\{bestFor\}\}/g, 
                    policyInfo.bestFor.join(", ")
                );
            }
        }
        
        return response;
    }

    /**
     * Formats the response with additional metadata
     */
    private formatResponse(response: string, category?: QuestionCategory): FormattedResponse {
        // Get suggestions based on both the response content and category
        let suggestions: string[] = this.knowledgeBase.getSuggestedQuestions(response);
        
        // If we have a category, supplement with category-specific suggestions
        if (category) {
            const categorySuggestions = this.getSuggestionsByCategory(category);
            
            // Merge and remove duplicates while preserving order
            const mergedSuggestions = [...suggestions];
            for (const suggestion of categorySuggestions) {
                if (!mergedSuggestions.includes(suggestion)) {
                    mergedSuggestions.push(suggestion);
                }
            }
            
            suggestions = mergedSuggestions.slice(0, 3); // Limit to 3 suggestions
        }
        
        const relatedTopics = this.knowledgeBase.getRelatedTopics(response);
        const confidence = this.calculateConfidence(response);

        return {
            message: response,
            suggestions,
            relatedTopics,
            confidence
        };
    }

    /**
     * Gets suggestions specific to a question category
     */
    private getSuggestionsByCategory(category: QuestionCategory): string[] {
        switch (category) {
            case 'basic':
                return commonQuestions.coverage;
            case 'health':
                return commonQuestions.healthRelated;
            case 'policy':
                return [
                    "What's the difference between term and whole life insurance?",
                    "Can I modify my policy after purchase?",
                    "How does cash value work in a whole life policy?"
                ];
            case 'claims':
                return commonQuestions.claims;
            default:
                return commonQuestions.coverage;
        }
    }

    /**
     * Calculates confidence score for a response
     */
    private calculateConfidence(response: string): number {
        // Basic confidence calculation based on response content
        if (response.includes("I don't have specific information")) {
            return 0.5; // Lower confidence when we don't have specific information
        }
        
        if (response.includes("I apologize") || response.includes("I'm having trouble")) {
            return 0.3; // Even lower for error states
        }
        
        // Higher confidence for detailed responses
        const detailMarkers = ['feature', 'benefit', 'cover', 'policy', 'premium', 'underwriting'];
        const detailCount = detailMarkers.filter(marker => response.includes(marker)).length;
        
        // Base confidence + additional for details
        return Math.min(0.7 + (detailCount * 0.05), 0.95);
    }

    /**
     * Handles template filling for responses
     */
    private fillTemplate(template: string, variables: Record<string, string>): string {
        return template.replace(
            /\{\{(\w+)\}\}/g,
            (match, key) => variables[key] || match
        );
    }

    /**
     * Generates a response using a specific template
     */
    public generateTemplatedResponse(templateName: string, variables: Record<string, any>): string {
        const template = getResponseTemplate(templateName);
        
        if (!template) {
            return `I don't have a template for "${templateName}". Let me provide you with general information instead.`;
        }
        
        // Check if we have all required context variables
        const missingContext = (template.contextRequired || []).filter(ctx => !variables[ctx]);
        
        if (missingContext.length > 0) {
            return `I need more information about ${missingContext.join(', ')} to answer that fully.`;
        }
        
        // Select a random response template from the options
        const responseTemplate = template.responses[Math.floor(Math.random() * template.responses.length)];
        
        // Fill in the template with variables
        return this.fillTemplate(responseTemplate, variables);
    }

    /**
     * Generates error responses
     */
    public generateErrorResponse(error: Error): FormattedResponse {
        logger.error('Generating error response', 'ResponseGenerator', 'generateErrorResponse', error);
        
        return {
            message: "I apologize, but I'm having trouble processing your request. " +
                    "Please try rephrasing your question or contact our support team for assistance.",
            suggestions: [
                "Can you explain your insurance needs?",
                "What type of coverage are you looking for?",
                "Would you like to speak with an insurance agent?"
            ],
            confidence: 1
        };
    }
}
}

