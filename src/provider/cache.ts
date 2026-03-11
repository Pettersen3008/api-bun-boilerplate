import { RedisClient } from "bun";
import { env } from "./config";

export interface CacheProvider {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  close?(): Promise<void>;
}

export type CacheMode = "noop" | "memory" | "redis";

class NoopCacheProvider implements CacheProvider {
  async get(_key: string): Promise<string | null> { return null; }
  
  async set(_key: string, _value: string, _ttlSeconds?: number): Promise<void> {}

  async del(_key: string): Promise<void> {}
}

class InMemoryCacheProvider implements CacheProvider {
  private readonly store = new Map<string, { value: string; expiresAt: number | null }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class RedisCacheProvider implements CacheProvider {
  constructor(private readonly redis: RedisClient) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.redis.set(key, value, "EX", ttlSeconds);
      return;
    }

    await this.redis.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async close(): Promise<void> {
    this.redis.close();
  }
}

function detectMode(): CacheMode {
  const raw = (env.CACHE_MODE ?? "").toLowerCase().trim();
  if (raw === "noop" || raw === "memory" || raw === "redis") {
    return raw;
  }

  return env.REDIS_URL ? "redis" : "memory";
}

export class CacheFactory {
  create(): CacheProvider {
    const mode = detectMode();

    if (mode === "noop") {
      return new NoopCacheProvider();
    }

    if (mode === "redis") {
      if (!env.REDIS_URL) {
        return new InMemoryCacheProvider();
      }

      return new RedisCacheProvider(new RedisClient(env.REDIS_URL));
    }

    return new InMemoryCacheProvider();
  }
}

export const cacheFactory = new CacheFactory();
export const cache = cacheFactory.create();
