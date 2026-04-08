/**
 * Safe error handler that prevents internal details from leaking to users.
 */

const isDev = import.meta.env.DEV;

/** Log error safely — in production strips stack traces and sensitive data */
export function logError(context: string, error: unknown): void {
  if (isDev) {
    console.error(`[${context}]`, error);
    return;
  }

  // In production, log only the message, never the full object
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`[${context}] ${message}`);
}

/** Get a user-safe error message */
export function getSafeErrorMessage(error: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  if (error instanceof Error) {
    // Allow known safe messages through
    const safePatterns = [
      'Email já registado',
      'Email já cadastrado',
      'Slug indisponível',
      'Senha fraca',
      'Campos obrigatórios',
      'Email ou senha incorretos',
      'Conta bloqueada',
    ];
    
    for (const pattern of safePatterns) {
      if (error.message.includes(pattern)) {
        return error.message;
      }
    }
  }
  
  return fallback;
}
