/**
 * Client-side rate limiter with server-side enforcement.
 * Combines localStorage timestamps (fast UX) with server-side
 * checks via log-security-event edge function (anti-bot).
 */

import { supabase } from '@/integrations/supabase/client';

// ── Client-side (localStorage) rate limiter ──

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

// ── Server-side rate limit check ──

interface ServerRateLimitResult {
  allowed: boolean;
  is_locked: boolean;
  ip_blocked: boolean;
  delay_ms: number;
  remaining_attempts: number;
  failed_attempts: number;
}

/**
 * Check server-side rate limits before attempting login.
 * Returns the server response or a permissive fallback if the call fails.
 */
export async function checkServerRateLimit(email: string): Promise<ServerRateLimitResult> {
  try {
    const { data, error } = await supabase.functions.invoke('log-security-event', {
      body: { action: 'check', email: email.toLowerCase().trim() },
    });

    if (error || !data) {
      // Fail open — don't block login if the check itself fails
      return { allowed: true, is_locked: false, ip_blocked: false, delay_ms: 0, remaining_attempts: 10, failed_attempts: 0 };
    }

    return data as ServerRateLimitResult;
  } catch {
    return { allowed: true, is_locked: false, ip_blocked: false, delay_ms: 0, remaining_attempts: 10, failed_attempts: 0 };
  }
}

/**
 * Log a security event and get back progressive delay info.
 */
export async function logSecurityEvent(
  eventType: string,
  email: string,
  metadata?: Record<string, unknown>
): Promise<ServerRateLimitResult | null> {
  try {
    const { data } = await supabase.functions.invoke('log-security-event', {
      body: { event_type: eventType, email: email.toLowerCase().trim(), metadata },
    });
    return data as ServerRateLimitResult | null;
  } catch {
    return null;
  }
}

/**
 * Enforce progressive delay — returns a promise that resolves after the delay.
 */
export function enforceDelay(delayMs: number): Promise<void> {
  if (delayMs <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

// ── Progressive delay stored client-side (for immediate UX) ──

const DELAY_STORAGE_KEY = 'rl_progressive_delay';

interface DelayState {
  delayMs: number;
  unlocksAt: number; // timestamp when the delay expires
}

export function getStoredDelay(): DelayState | null {
  try {
    const raw = localStorage.getItem(DELAY_STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as DelayState;
    if (Date.now() >= state.unlocksAt) {
      localStorage.removeItem(DELAY_STORAGE_KEY);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

export function storeDelay(delayMs: number): void {
  if (delayMs <= 0) return;
  try {
    const state: DelayState = { delayMs, unlocksAt: Date.now() + delayMs };
    localStorage.setItem(DELAY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearStoredDelay(): void {
  try {
    localStorage.removeItem(DELAY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
