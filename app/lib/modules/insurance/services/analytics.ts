import { logger } from '../utils/logger'
import { InsuranceConfig } from '../config'

export interface ChatMetrics {
sessionId: string
queryText: string
responseText: string
confidenceScore: number
responseTime: number
wasHelpful?: boolean
category?: string
}

export interface PerformanceMetrics {
averageResponseTime: number
averageConfidenceScore: number
userSatisfactionRate: number
totalInteractions: number
}

export class AnalyticsService {
private interactions: ChatMetrics[] = []
private readonly config: InsuranceConfig

constructor(config: InsuranceConfig) {
    this.config = config
}

public trackInteraction(metrics: ChatMetrics): void {
    try {
    this.interactions.push(metrics)
    logger.info('Tracked chat interaction', { sessionId: metrics.sessionId })
    
    // Persist metrics if configured
    if (this.config.analytics.persistMetrics) {
        this.persistMetrics(metrics)
    }
    } catch (error) {
    logger.error('Failed to track interaction', { error })
    }
}

public getPerformanceMetrics(): PerformanceMetrics {
    const totalInteractions = this.interactions.length
    
    if (totalInteractions === 0) {
    return {
        averageResponseTime: 0,
        averageConfidenceScore: 0,
        userSatisfactionRate: 0,
        totalInteractions: 0
    }
    }

    const avgResponseTime = this.interactions.reduce(
    (sum, metric) => sum + metric.responseTime, 
    0
    ) / totalInteractions

    const avgConfidence = this.interactions.reduce(
    (sum, metric) => sum + metric.confidenceScore,
    0
    ) / totalInteractions

    const satisfiedInteractions = this.interactions.filter(
    metric => metric.wasHelpful === true
    ).length

    return {
    averageResponseTime: avgResponseTime,
    averageConfidenceScore: avgConfidence,
    userSatisfactionRate: (satisfiedInteractions / totalInteractions) * 100,
    totalInteractions
    }
}

public getTopQuestions(): Map<string, number> {
    const questionCounts = new Map<string, number>()
    
    this.interactions.forEach(interaction => {
    const count = questionCounts.get(interaction.queryText) || 0
    questionCounts.set(interaction.queryText, count + 1)
    })

    return new Map([...questionCounts.entries()].sort((a, b) => b[1] - a[1]))
}

public getCategoryDistribution(): Map<string, number> {
    const categoryDistribution = new Map<string, number>()
    
    this.interactions.forEach(interaction => {
    if (interaction.category) {
        const count = categoryDistribution.get(interaction.category) || 0
        categoryDistribution.set(interaction.category, count + 1)
    }
    })

    return categoryDistribution
}

private async persistMetrics(metrics: ChatMetrics): Promise<void> {
    try {
    // Implementation would depend on your storage solution
    // Could be a database, analytics service, or logging system
    logger.info('Persisting metrics', { metrics })
    } catch (error) {
    logger.error('Failed to persist metrics', { error })
    }
}
}

