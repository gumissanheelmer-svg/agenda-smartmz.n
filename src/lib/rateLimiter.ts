/**
 * Client-side rate limiter using localStorage timestamps.
 * Prevents brute-force attacks on login and registration forms.
 */

interface RateLimitConfig {
  key: string;
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMs: number;
}

function getAttempts(key: string): number[] {
  try {
    const raw = localStorage.getItem(`rl_${key}`);
    if (!raw) return [];
    return JSON.parse(raw) as number[];
  } catch {
    return [];
  }
}

function setAttempts(key: string, attempts: number[]): void {
  try {
    localStorage.setItem(`rl_${key}`, JSON.stringify(attempts));
  } catch {
    // localStorage full or unavailable — fail open
  }
}

export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Filter to only recent attempts within the window
  const attempts = getAttempts(config.key).filter((t) => t > windowStart);

  if (attempts.length >= config.maxAttempts) {
    const oldestInWindow = Math.min(...attempts);
    const retryAfterMs = oldestInWindow + config.windowMs - now;
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMs: Math.max(retryAfterMs, 0),
    };
  }

  return {
    allowed: true,
    remainingAttempts: config.maxAttempts - attempts.length,
    retryAfterMs: 0,
  };
}

export function recordAttempt(config: RateLimitConfig): void {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const attempts = getAttempts(config.key).filter((t) => t > windowStart);
  attempts.push(now);
  setAttempts(config.key, attempts);
}

export function clearRateLimit(key: string): void {
  try {
    localStorage.removeItem(`rl_${key}`);
  } catch {
    // ignore
  }
}

// Pre-configured limiters
export const LOGIN_LIMIT = {
  key: 'login',
  maxAttempts: 5,
  windowMs: 60_000, // 1 minute
};

export const REGISTER_LIMIT = {
  key: 'register',
  maxAttempts: 3,
  windowMs: 60_000,
};
