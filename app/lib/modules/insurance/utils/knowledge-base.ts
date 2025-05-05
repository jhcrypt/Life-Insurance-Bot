import { KnowledgeBaseEntry } from '../types';

/**
 * Knowledge base for insurance information
 * Stores and retrieves insurance-related knowledge
 */
export class KnowledgeBase {
  private entries: KnowledgeBaseEntry[] = [];

  constructor() {
    this.initializeKnowledgeBase();
  }

  /**
   * Initializes the knowledge base with insurance information
   */
  private initializeKnowledgeBase(): void {
    this.entries = [
      {
        term: 'term life insurance',
        definition: 'Insurance that provides coverage for a specific period (term), typically 10, 20, or 30 years, with level premiums and no cash value component.',
        category: 'basic',
        relatedTerms: ['whole life insurance', 'premium', 'death benefit']
      },
      {
        term: 'whole life insurance',
        definition: 'Permanent life insurance that provides coverage for your entire life, includes a cash value component, and typically has fixed premiums.',
        category: 'basic',
        relatedTerms: ['term life insurance', 'cash value', 'permanent insurance']
      },
      {
        term: 'universal life insurance',
        definition: 'A type of permanent life insurance with flexible premiums and death benefits, where the cash value earns interest based on current market rates.',
        category: 'basic',
        relatedTerms: ['variable life insurance', 'whole life insurance', 'cash value']
      },
      {
        term: 'medical underwriting',
        definition: 'The process insurers use to evaluate your health status, medical history, and other factors to determine risk and set premium rates.',
        category: 'health',
        relatedTerms: ['medical exam', 'no-exam insurance', 'risk classification']
      },
      {
        term: 'pre-existing condition',
        definition: 'A health condition that existed before applying for insurance, which may affect eligibility, premium rates, or coverage limitations.',
        category: 'health',
        relatedTerms: ['exclusions', 'medical underwriting', 'guaranteed issue']
      },
      {
        term: 'premium',
        definition: 'The amount paid to the insurance company to maintain coverage, which can be paid monthly, quarterly, semi-annually, or annually.',
        category: 'policy',
        relatedTerms: ['policy fee', 'rate class', 'payment mode']
      },
      {
        term: 'death benefit',
        definition: 'The amount of money paid to beneficiaries upon the insured person\'s death, which is generally income tax-free.',
        category: 'policy',
        relatedTerms: ['beneficiary', 'face value', 'payout']
      },
      {
        term: 'claim process',
        definition: 'The procedure beneficiaries follow to receive the death benefit, which typically involves submitting a death certificate and claim form.',
        category: 'claims',
        relatedTerms: ['beneficiary', 'death benefit', 'contestability period']
      }
    ];
  }

  /**
   * Finds information relevant to a given topic
   */
  public findRelevantInformation(topic: string): string {
    // Find exact matches or related entries
    const exactMatch = this.entries.find(entry => 
      entry.term.toLowerCase() === topic.toLowerCase()
    );
    
    if (exactMatch) {
      return exactMatch.definition;
    }
    
    // Find partial matches
    const partialMatches = this.entries.filter(entry => 
      topic.toLowerCase().includes(entry.term.toLowerCase()) ||
      entry.term.toLowerCase().includes(topic.toLowerCase())
    );
    
    if (partialMatches.length > 0) {
      // Return the most relevant match (could implement more sophisticated matching)
      return partialMatches[0].definition;
    }
    
    // Default response if no matches found
    return `I don't have specific information about "${topic}" in my knowledge base. Would you like to know about term life insurance, whole life insurance, or another insurance topic?`;
  }

  /**
   * Gets suggested follow-up questions based on context
   */
  public getSuggestedQuestions(context: string): string[] {
    // Find entries that might be related to the context
    const relatedEntries = this.entries.filter(entry => 
      context.toLowerCase().includes(entry.term.toLowerCase())
    );
    
    // Generate questions based on related terms
    if (relatedEntries.length > 0) {
      const relatedTerms = relatedEntries[0].relatedTerms || [];
      
      return relatedTerms.map(term => {
        const matchingEntry = this.entries.find(e => e.term.toLowerCase() === term.toLowerCase());
        
        if (matchingEntry) {
          return `What is ${term}?`;
        } else {
          return `Can you tell me about ${term}?`;
        }
      }).slice(0, 3); // Limit to 3 suggestions
    }
    
    // Default suggestions if no context match
    return [
      "What's the difference between term and whole life insurance?",
      "How much coverage do I need?",
      "How do I file a claim?"
    ];
  }

  /**
   * Gets related topics based on context
   */
  public getRelatedTopics(context: string): string[] {
    // Similar to getSuggestedQuestions but returns just the topics
    const relatedEntries = this.entries.filter(entry => 
      context.toLowerCase().includes(entry.term.toLowerCase())
    );
    
    if (relatedEntries.length > 0) {
      return (relatedEntries[0].relatedTerms || []).slice(0, 3);
    }
    
    return [];
  }

  /**
   * Searches the knowledge base for entries matching a query
   */
  public search(query: string): KnowledgeBaseEntry[] {
    return this.entries.filter(entry => 
      entry.term.toLowerCase().includes(query.toLowerCase()) ||
      entry.definition.toLowerCase().includes(query.toLowerCase()) ||
      (entry.relatedTerms || []).some(term => 
        term.toLowerCase().includes(query.toLowerCase())
      )
    );
  }
}

export interface InsuranceDefinition {
term: string;
definition: string;
category: string;
}

export interface PolicyType {
name: string;
description: string;
features: string[];
bestFor: string[];
}

export interface ResponseTemplate {
intent: string;
responses: string[];
contextRequired?: string[];
}

export const insuranceTerms: InsuranceDefinition[] = [
{
    term: "Premium",
    definition: "The amount paid regularly to maintain insurance coverage",
    category: "basics",
},
{
    term: "Death Benefit",
    definition: "The amount paid to beneficiaries upon the insured person's death",
    category: "benefits",
},
{
    term: "Beneficiary",
    definition: "The person or entity designated to receive the insurance payout",
    category: "basics",
},
{
    term: "Underwriting",
    definition: "The process of evaluating risk to determine premium rates",
    category: "process",
},
{
    term: "Cash Value",
    definition: "The savings component of permanent life insurance policies",
    category: "features",
},
];

export const policyTypes: PolicyType[] = [
{
    name: "Term Life Insurance",
    description: "Coverage for a specific period, typically 10-30 years",
    features: [
    "Lower premiums",
    "Fixed death benefit",
    "No cash value component",
    "Convertible to permanent insurance",
    ],
    bestFor: [
    "Temporary coverage needs",
    "Budget-conscious individuals",
    "Young families",
    "Mortgage protection",
    ],
},
{
    name: "Whole Life Insurance",
    description: "Permanent coverage that lasts your entire life",
    features: [
    "Guaranteed death benefit",
    "Builds cash value",
    "Fixed premiums",
    "Dividend potential",
    ],
    bestFor: [
    "Lifetime coverage needs",
    "Estate planning",
    "Business succession",
    "Long-term savings goals",
    ],
},
];

export const responseTemplates: ResponseTemplate[] = [
{
    intent: "policy_explanation",
    responses: [
    "{{policyType}} provides {{description}}. Key features include: {{features}}",
    "A {{policyType}} policy is designed to {{description}}. You might consider this if you need: {{bestFor}}",
    ],
    contextRequired: ["policyType"],
},
{
    intent: "term_definition",
    responses: [
    "{{term}} refers to {{definition}}",
    "In insurance terms, {{term}} means {{definition}}",
    ],
    contextRequired: ["term"],
},
];

export const commonQuestions = {
coverage: [
    "How much coverage do I need?",
    "What factors determine my coverage amount?",
    "Can I change my coverage amount later?",
],
healthRelated: [
    "Do I need a medical exam?",
    "How do pre-existing conditions affect my policy?",
    "What health factors impact my premium?",
],
claims: [
    "How do I file a claim?",
    "What documents are needed for a claim?",
    "How long does claim processing take?",
],
};

export const getResponseTemplate = (intent: string): ResponseTemplate | undefined => {
return responseTemplates.find(template => template.intent === intent);
};

export const findPolicyType = (name: string): PolicyType | undefined => {
return policyTypes.find(policy => 
    policy.name.toLowerCase() === name.toLowerCase()
);
};

export const findTerm = (searchTerm: string): InsuranceDefinition | undefined => {
return insuranceTerms.find(term => 
    term.term.toLowerCase() === searchTerm.toLowerCase()
);
};

