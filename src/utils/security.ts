/**
 * Security and validation utilities for EarnBD
 */

/**
 * Validates external URLs to prevent XSS and malicious scheme execution.
 * Only allows valid http and https protocols.
 */
export function isValidExternalUrl(urlString?: string): boolean {
  if (!urlString || typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  
  // Reject dangerous protocols
  const dangerousPatterns = /^(javascript:|data:|vbscript:|file:|about:)/i;
  if (dangerousPatterns.test(trimmed)) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates 11-digit Bangladeshi mobile number format
 * Valid prefixes: 013, 014, 015, 016, 017, 018, 019
 */
export function isValidBdMobileNumber(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  const bdMobileRegex = /^01[3-9]\d{8}$/;
  return bdMobileRegex.test(cleaned);
}

/**
 * Generates an immutable, collision-resistant idempotency key
 */
export function generateIdempotencyKey(prefix: string, entityId: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${entityId}_${timestamp}_${randomStr}`;
}

/**
 * Formats monetary numbers into BDT currency format
 */
export function formatBDT(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '৳0';
  return `৳${Math.floor(amount).toLocaleString('en-US')}`;
}

/**
 * Sanitizes plain text input
 */
export function sanitizeText(text: string, maxLength: number = 250): string {
  if (!text) return '';
  return text.trim().slice(0, maxLength);
}
