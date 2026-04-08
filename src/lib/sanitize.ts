/**
 * Input sanitization utilities to prevent XSS and injection attacks.
 */

/** Strip HTML tags, trim, and limit length */
export function sanitizeText(input: string, maxLength = 255): string {
  return input
    .replace(/<[^>]*>/g, '')   // strip HTML tags
    .replace(/[<>"'`]/g, '')   // remove dangerous chars
    .trim()
    .slice(0, maxLength);
}

/** Allow only digits, +, spaces, and dashes for phone numbers */
export function sanitizePhone(input: string, maxLength = 20): string {
  return input
    .replace(/[^\d+\s\-()]/g, '')
    .trim()
    .slice(0, maxLength);
}

/** Trim, lowercase, and basic format validation for email */
export function sanitizeEmail(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .trim()
    .toLowerCase()
    .slice(0, 255);
}

/** Sanitize a URL slug */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 100);
}
