// Insurance policy types
export type PolicyType = 'term' | 'whole' | 'universal' | 'variable';

// Insurance question categories
export type QuestionCategory = 'basic' | 'health' | 'policy' | 'claims';

// Response template structure
export interface ResponseTemplate {
category: QuestionCategory;
question: string;
answer: string;
}

// Insurance knowledge base entry
export interface KnowledgeBaseEntry {
term: string;
definition: string;
category: QuestionCategory;
relatedTerms?: string[];
}

// Chat message specific to insurance
export interface InsuranceMessage {
role: 'user' | 'assistant';
content: string;
category?: QuestionCategory;
timestamp: Date;
}

// Insurance service configuration
export interface InsuranceServiceConfig {
model: string;
temperature: number;
maxTokens: number;
}

