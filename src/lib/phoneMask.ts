/**
 * Masks a phone number for display, showing only first 2-3 and last 3 digits.
 * Example: "841234423" → "84****423"
 * Example: "+258841234423" → "+25*******423"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || phone.length < 5) return '***';

  if (phone.length <= 9) {
    const visible = 2 + 3; // first 2, last 3
    const masked = phone.length - visible;
    return phone.slice(0, 2) + '*'.repeat(Math.max(masked, 1)) + phone.slice(-3);
  }

  const visible = 3 + 3; // first 3, last 3
  const masked = phone.length - visible;
  return phone.slice(0, 3) + '*'.repeat(Math.max(masked, 1)) + phone.slice(-3);
}
