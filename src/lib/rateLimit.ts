export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const store = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  return function checkRateLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const key = identifier;
    const record = store.get(key);

    if (!record || now > record.resetTime) {
      store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return {
        allowed: true,
        remaining: config.max - 1,
        resetTime: now + config.windowMs,
      };
    }

    if (record.count >= config.max) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
      };
    }

    record.count += 1;
    return {
      allowed: true,
      remaining: config.max - record.count,
      resetTime: record.resetTime,
    };
  };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  store.forEach((value, key) => {
    if (now > value.resetTime) store.delete(key);
  });
}, 5 * 60 * 1000);

// Pre-configured limiters
export const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
});

export const extractLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
});

/** Public share Play — audio lesson (per IP + share + kind). */
export const shareAudioPlayLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 2,
});

/** Public share Play — podcast is heavier (per IP + share + kind). */
export const sharePodcastPlayLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1,
});

/** Cap how many share Play calls one IP can make across all shares. */
export const sharePlayIpGlobalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 6,
});

/** Cap Polly burn on a single viral share (all visitors). */
export const shareAudioShareGlobalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 24,
});

export const sharePodcastShareGlobalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 12,
});

