/**
 * Safe error handler that prevents internal details from leaking to users.
 * All errors shown to users are generic — real details only go to logs.
 */

import { supabase } from '@/integrations/supabase/client';

const isDev = import.meta.env.DEV;

/** Log error safely — in production strips stack traces and sensitive data */
export function logError(context: string, error: unknown): void {
  if (isDev) {
    console.error(`[${context}]`, error);
    return;
  }

  // In production, log only a sanitized message, never the full object
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`[${context}] ${message}`);
}

// Safe messages that can be shown to users
const SAFE_MESSAGE_MAP: Record<string, string> = {
  // Auth
  'Invalid login credentials': 'Email ou senha incorretos.',
  'Email not confirmed': 'Por favor, confirme seu email antes de entrar.',
  'User already registered': 'Este email já está registado.',
  'Password should be at least': 'A senha deve ter pelo menos 6 caracteres.',
  'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
  'For security purposes': 'Muitas tentativas. Aguarde alguns minutos.',
  // Business
  'Horário indisponível': 'Horário indisponível. O profissional já possui um agendamento neste período.',
  'Serviço não encontrado': 'Serviço não encontrado ou inativo.',
  'Profissional não encontrado': 'Profissional não encontrado ou inativo.',
  'Estabelecimento não encontrado': 'Estabelecimento não encontrado.',
  'Código já': 'Este código já foi utilizado.',
  'Já existe': 'Já existe uma submissão para este item.',
  'Acesso negado': 'Sem permissão para esta ação.',
};

/** Get a user-safe error message — never leaks internal details */
export function getSafeErrorMessage(
  error: unknown,
  fallback = 'Ocorreu um erro. Tente novamente.'
): string {
  if (!(error instanceof Error)) return fallback;

  const msg = error.message;

  // Check against known safe messages
  for (const [pattern, safeMsg] of Object.entries(SAFE_MESSAGE_MAP)) {
    if (msg.includes(pattern)) {
      return safeMsg;
    }
  }

  // In development, pass through
  if (isDev) return msg;

  // In production, never show the raw error
  return fallback;
}

/**
 * Silently report an error to security logging.
 * Fire-and-forget — never blocks or throws.
 */
export function reportSecurityError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  try {
    const message = error instanceof Error ? error.message : 'Unknown error';
    supabase.functions
      .invoke('log-security-event', {
        body: {
          event_type: 'application_error',
          metadata: {
            context: context.slice(0, 100),
            error_message: message.slice(0, 200),
            source: 'error_handler',
            ...metadata,
          },
        },
      })
      .catch(() => {});
  } catch {
    // fail silently
  }
}
