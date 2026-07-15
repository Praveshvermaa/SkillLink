import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.warn('Warning: REDIS_URL environment variable is not defined.');
}

const globalForRedis = global as unknown as { redis: Redis | undefined };

export const redis = globalForRedis.redis ?? new Redis(redisUrl || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
});

if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
}

export async function getCached<T>(key: string): Promise<T | null> {
    try {
        const cached = await redis.get(key);
        if (!cached) return null;
        return JSON.parse(cached) as T;
    } catch (error) {
        console.error(`Redis error fetching key "${key}":`, error);
        return null;
    }
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
        console.error(`Redis error setting key "${key}":`, error);
    }
}

export async function deleteCached(key: string): Promise<void> {
    try {
        await redis.del(key);
    } catch (error) {
        console.error(`Redis error deleting key "${key}":`, error);
    }
}

export async function deletePattern(pattern: string): Promise<void> {
    try {
        let cursor = '0';
        do {
            const reply = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = reply[0];
            const keys = reply[1];
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } while (cursor !== '0');
    } catch (error) {
        console.error(`Redis error deleting pattern "${pattern}":`, error);
    }
}
