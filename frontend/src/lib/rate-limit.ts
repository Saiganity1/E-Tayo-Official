import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let hasLoggedMissingRedis = false;
let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!hasLoggedMissingRedis) {
      console.error(
        "[RateLimit] Critical: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not configured. Rate limiters are failing CLOSED to protect endpoints."
      );
      hasLoggedMissingRedis = true;
    }
    return null;
  }

  try {
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch (err) {
    console.error("[RateLimit] Error initializing Upstash Redis client:", err);
    return null;
  }
}

interface LimiterWrapper {
  limit: (identifier: string) => Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }>;
}

function createSlidingLimiter(
  prefix: string,
  requests: number,
  windowDuration: "1 m" | "15 m"
): LimiterWrapper {
  let ratelimitInstance: Ratelimit | null = null;

  return {
    async limit(identifier: string) {
      const redis = getRedis();

      if (!redis) {
        // Fail CLOSED: When Upstash Redis credentials are not configured, reject the request
        return {
          success: false,
          limit: requests,
          remaining: 0,
          reset: Date.now() + 60000,
        };
      }

      if (!ratelimitInstance) {
        ratelimitInstance = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(requests, windowDuration),
          prefix,
        });
      }

      const res = await ratelimitInstance.limit(identifier);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    },
  };
}

// Sliding window limiters — durable across serverless instances (Upstash)
export const chatLimiter = createSlidingLimiter("rl:chat", 10, "1 m");
export const loginLimiter = createSlidingLimiter("rl:login", 5, "15 m");
export const otpLimiter = createSlidingLimiter("rl:otp", 6, "15 m");

// Key by real client IP on Vercel (x-forwarded-for is set at the edge)
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
