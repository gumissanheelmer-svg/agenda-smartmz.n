/**
 * Client-side behavior guard — detects and blocks suspicious patterns.
 * Works alongside the server-side log-security-event edge function.
 *
 * Tracks action frequency per action type using localStorage.
 * When thresholds are exceeded, blocks the action and logs to server.
 */

import { supabase } from '@/integrations/supabase/client';

// ── Action Throttle Configs ──

export interface ActionThrottle {
  /** Unique key for this action type */
  action: string;
  /** Maximum allowed occurrences within windowMs */
  maxActions: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Cooldown in ms after being blocked */
  cooldownMs: number;
}

export const BOOKING_THROTTLE: ActionThrottle = {
  action: 'booking_submit',
  maxActions: 5,
  windowMs: 5 * 60_000,   // 5 min
  cooldownMs: 60_000,      // 1 min cooldown
};

export const PAYMENT_THROTTLE: ActionThrottle = {
  action: 'payment_submit',
  maxActions: 3,
  windowMs: 5 * 60_000,
  cooldownMs: 120_000,     // 2 min cooldown
};

export const REGISTER_THROTTLE: ActionThrottle = {
  action: 'register_submit',
  maxActions: 3,
  windowMs: 10 * 60_000,
  cooldownMs: 120_000,
};

export const PASSWORD_RESET_THROTTLE: ActionThrottle = {
  action: 'password_reset',
  maxActions: 3,
  windowMs: 15 * 60_000,
  cooldownMs: 60_000,
};

// ── Core Functions ──

interface ActionLog {
  timestamps: number[];
  blockedUntil?: number;
}

function getKey(action: string): string {
  return `bg_${action}`;
}

function getActionLog(action: string): ActionLog {
  try {
    const raw = localStorage.getItem(getKey(action));
    if (!raw) return { timestamps: [] };
    return JSON.parse(raw) as ActionLog;
  } catch {
    return { timestamps: [] };
  }
}

function saveActionLog(action: string, log: ActionLog): void {
  try {
    localStorage.setItem(getKey(action), JSON.stringify(log));
  } catch {
    // fail open
  }
}

export interface GuardResult {
  allowed: boolean;
  /** Seconds remaining in cooldown (0 if allowed) */
  cooldownSeconds: number;
  /** Reason for block */
  reason?: string;
}

/**
 * Check if an action is currently allowed.
 * Does NOT record the action — call recordAction() after the action succeeds.
 */
export function checkAction(throttle: ActionThrottle): GuardResult {
  const log = getActionLog(throttle.action);
  const now = Date.now();

  // Check if in active cooldown
  if (log.blockedUntil && now < log.blockedUntil) {
    return {
      allowed: false,
      cooldownSeconds: Math.ceil((log.blockedUntil - now) / 1000),
      reason: 'cooldown_active',
    };
  }

  // Clean old entries
  const windowStart = now - throttle.windowMs;
  const recent = log.timestamps.filter((t) => t > windowStart);

  if (recent.length >= throttle.maxActions) {
    // Trigger cooldown
    const blockedUntil = now + throttle.cooldownMs;
    saveActionLog(throttle.action, { timestamps: recent, blockedUntil });

    // Fire-and-forget: log to server
    logSuspiciousAction(throttle.action, {
      recent_count: recent.length,
      window_ms: throttle.windowMs,
      threshold: throttle.maxActions,
    });

    return {
      allowed: false,
      cooldownSeconds: Math.ceil(throttle.cooldownMs / 1000),
      reason: 'threshold_exceeded',
    };
  }

  return { allowed: true, cooldownSeconds: 0 };
}

/**
 * Record a successful action execution.
 */
export function recordAction(throttle: ActionThrottle): void {
  const log = getActionLog(throttle.action);
  const now = Date.now();
  const windowStart = now - throttle.windowMs;
  const recent = log.timestamps.filter((t) => t > windowStart);
  recent.push(now);
  saveActionLog(throttle.action, { ...log, timestamps: recent });
}

/**
 * Clear all tracking for an action (e.g. on successful login).
 */
export function clearAction(action: string): void {
  try {
    localStorage.removeItem(getKey(action));
  } catch {
    // ignore
  }
}

// ── Server-Side Behavior Check ──

interface ServerBehaviorResult {
  allowed: boolean;
  blocked: boolean;
  reason?: string;
  cooldown_seconds: number;
  events_detected: string[];
}

/**
 * Server-side behavior analysis — checks patterns via the edge function.
 * Call before sensitive operations to get a server verdict.
 */
export async function checkServerBehavior(
  actionType: string,
  email?: string,
  metadata?: Record<string, unknown>
): Promise<ServerBehaviorResult> {
  try {
    const { data, error } = await supabase.functions.invoke('log-security-event', {
      body: {
        action: 'check_behavior',
        event_type: actionType,
        email: email?.toLowerCase().trim() || null,
        metadata,
      },
    });

    if (error || !data) {
      return { allowed: true, blocked: false, cooldown_seconds: 0, events_detected: [] };
    }

    return data as ServerBehaviorResult;
  } catch {
    // Fail open
    return { allowed: true, blocked: false, cooldown_seconds: 0, events_detected: [] };
  }
}

/**
 * Log a suspicious action to the server (fire-and-forget).
 */
function logSuspiciousAction(
  actionType: string,
  metadata: Record<string, unknown>
): void {
  supabase.functions
    .invoke('log-security-event', {
      body: {
        event_type: 'suspicious_activity',
        email: null,
        metadata: { action: actionType, ...metadata, source: 'client_behavior_guard' },
      },
    })
    .catch(() => {});
}
