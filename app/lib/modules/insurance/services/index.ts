import type { 
InsuranceMessage, 
InsuranceServiceConfig,
QuestionCategory,
KnowledgeBaseEntry
} from '../types';

export class InsuranceService {
private config: InsuranceServiceConfig;

constructor(config: InsuranceServiceConfig) {
    this.config = config;
}

async processQuery(query: string): Promise<InsuranceMessage> {
    // TODO: Implement query processing logic
    return {
    role: 'assistant',
    content: 'Response placeholder',
    timestamp: new Date()
    };
}

async categorizeQuestion(query: string): Promise<QuestionCategory> {
    // TODO: Implement question categorization
    return 'basic';
}

async searchKnowledgeBase(term: string): Promise<KnowledgeBaseEntry[]> {
    // TODO: Implement knowledge base search
    return [];
}
}

export * from './knowledge-service';
export * from './huggingface-client';

