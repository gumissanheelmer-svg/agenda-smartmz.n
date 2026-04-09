/**
 * Security middleware for invisible protection.
 * Detects common attack patterns in requests and silently blocks them.
 */

import { supabase } from '@/integrations/supabase/client';

// ── Attack Pattern Detection ──

const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|alter|create|exec|execute)\b.*\b(from|into|table|database|where)\b)/i,
  /('|\-\-|;|\/\*|\*\/)/,
  /(or|and)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
];

const XSS_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /on(load|error|click|mouseover|focus|blur)\s*=/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /document\.(cookie|location|write)/i,
  /eval\s*\(/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/, 
  /%2e%2e/i,
  /%252e/i,
];

export type ThreatType = 'sql_injection' | 'xss' | 'path_traversal' | 'none';

/**
 * Detect if input contains attack patterns.
 * Returns the threat type or 'none'.
 */
export function detectThreat(input: string): ThreatType {
  if (!input || typeof input !== 'string') return 'none';

  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) return 'sql_injection';
  }

  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) return 'xss';
  }

  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(input)) return 'path_traversal';
  }

  return 'none';
}

/**
 * Scan all values in a form/object for threats.
 * Returns first threat found or 'none'.
 */
export function scanFormInputs(values: Record<string, unknown>): { 
  threat: ThreatType; 
  field?: string 
} {
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string') {
      const threat = detectThreat(value);
      if (threat !== 'none') {
        return { threat, field: key };
      }
    }
  }
  return { threat: 'none' };
}

/**
 * Silently log a detected attack attempt.
 * Fire-and-forget — never blocks UI.
 */
export function logThreatSilently(
  threatType: ThreatType,
  context: string,
  metadata?: Record<string, unknown>
): void {
  try {
    supabase.functions
      .invoke('log-security-event', {
        body: {
          event_type: 'attack_detected',
          metadata: {
            threat_type: threatType,
            context: context.slice(0, 100),
            source: 'security_middleware',
            ...metadata,
          },
        },
      })
      .catch(() => {});
  } catch {
    // fail silently — never reveal detection to attacker
  }
}
