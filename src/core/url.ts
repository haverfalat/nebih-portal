import { ValidationError } from './errors.js';

export function resolveUrl(value: string | undefined, base: string): string | null {
  if (!value || /^(?:javascript|data|vbscript):/i.test(value.trim())) return null;
  try {
    const url = new URL(value, base);
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function normalizeUrl(value: string): string {
  const url = new URL(value);
  url.hash = '';
  url.searchParams.sort();
  return url.href;
}

export function positiveInteger(
  value: number,
  name: string,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new ValidationError(`${name} must be an integer between 1 and ${maximum}`);
  }
  return value;
}

export function nonNegative(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0)
    throw new ValidationError(`${name} must be finite and non-negative`);
  return value;
}

export function isDocumentUrl(url: string): boolean {
  const path = new URL(url).pathname;
  return (
    /\/(?:documents|document_library)\//i.test(path) ||
    /\.(?:pdf|docx?|xlsx?|csv|zip|xml|json|txt|rtf|odt|ods|pptx?|wsdl|xsd)(?:\/|$)/i.test(path)
  );
}

export function documentExtension(url: string): string | null {
  let path = new URL(url).pathname;
  try {
    path = decodeURI(path);
  } catch {}
  return /\.([a-z\d]{2,6})(?:\/|$)/i.exec(path)?.[1]?.toLowerCase() ?? null;
}
