import { Logger } from '../utils/logger';
import { Config } from '../config';

// Storage backend interface
interface StorageBackend {
get(key: string): Promise<any>;
set(key: string, value: any, ttl?: number): Promise<void>;
delete(key: string): Promise<void>;
clear(): Promise<void>;
}

// In-memory storage implementation
class MemoryStorage implements StorageBackend {
private store: Map<string, { value: any; expiry: number }> = new Map();

async get(key: string): Promise<any> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
    this.store.delete(key);
    return null;
    }
    return item.value;
}

async set(key: string, value: any, ttl?: number): Promise<void> {
    const expiry = ttl ? Date.now() + ttl * 1000 : undefined;
    this.store.set(key, { value, expiry });
}

async delete(key: string): Promise<void> {
    this.store.delete(key);
}

async clear(): Promise<void> {
    this.store.clear();
}
}

// Redis storage implementation
class RedisStorage implements StorageBackend {
private client: any; // Redis client instance

constructor(redisClient: any) {
    this.client = redisClient;
}

async get(key: string): Promise<any> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
}

async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
    await this.client.setex(key, ttl, serialized);
    } else {
    await this.client.set(key, serialized);
    }
}

async delete(key: string): Promise<void> {
    await this.client.del(key);
}

async clear(): Promise<void> {
    await this.client.flushdb();
}
}

interface CacheOptions {
ttl?: number;
prefix?: string;
storage?: 'memory' | 'redis';
}

export class CacheService {
private storage: StorageBackend;
private prefix: string;
private defaultTTL: number;
private logger: Logger;

constructor(config: Config, logger: Logger, options: CacheOptions = {}) {
    this.logger = logger;
    this.prefix = options.prefix || 'insurance:';
    this.defaultTTL = options.ttl || 3600; // 1 hour default

    // Initialize storage backend based on configuration
    if (options.storage === 'redis' && config.redis) {
    this.storage = new RedisStorage(config.redis);
    } else {
    this.storage = new MemoryStorage();
    }
}

private getKey(key: string): string {
    return `${this.prefix}${key}`;
}

async get<T>(key: string): Promise<T | null> {
    try {
    const fullKey = this.getKey(key);
    const value = await this.storage.get(fullKey);
    this.logger.debug(`Cache get: ${fullKey}`, { hit: !!value });
    return value;
    } catch (error) {
    this.logger.error(`Cache get error: ${key}`, error);
    return null;
    }
}

async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
    const fullKey = this.getKey(key);
    await this.storage.set(fullKey, value, ttl || this.defaultTTL);
    this.logger.debug(`Cache set: ${fullKey}`, { ttl: ttl || this.defaultTTL });
    } catch (error) {
    this.logger.error(`Cache set error: ${key}`, error);
    }
}

async delete(key: string): Promise<void> {
    try {
    const fullKey = this.getKey(key);
    await this.storage.delete(fullKey);
    this.logger.debug(`Cache delete: ${fullKey}`);
    } catch (error) {
    this.logger.error(`Cache delete error: ${key}`, error);
    }
}

async clear(): Promise<void> {
    try {
    await this.storage.clear();
    this.logger.info('Cache cleared');
    } catch (error) {
    this.logger.error('Cache clear error', error);
    }
}

// Utility method to get or set cache with a factory function
async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
    return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
}

// Method to invalidate cache entries by pattern
async invalidatePattern(pattern: string): Promise<void> {
    try {
    // Basic pattern matching for memory storage
    // For Redis, this could use SCAN and pattern matching
    if (this.storage instanceof MemoryStorage) {
        const fullPattern = this.getKey(pattern);
        // Simple wildcard matching
        const regex = new RegExp(
        '^' + fullPattern.replace(/\*/g, '.*') + '$'
        );
        
        // For memory storage, iterate through keys and delete matching ones
        const promises = Array.from(
        (this.storage as any).store.keys()
        ).filter((key) => regex.test(key))
        .map((key) => this.delete(key.slice(this.prefix.length)));
        
        await Promise.all(promises);
    }
    this.logger.info(`Cache invalidated by pattern: ${pattern}`);
    } catch (error) {
    this.logger.error(`Cache pattern invalidation error: ${pattern}`, error);
    }
}
}

