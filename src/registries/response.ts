import { ParseError } from '../core/errors.js';

function parseNested(value: unknown): unknown {
  if (typeof value === 'string' && /^[\s]*[\[{]/.test(value)) {
    try {
      return parseNested(JSON.parse(value));
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) return value.map(parseNested);
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, parseNested(item)]));
  return value;
}

export function parseRegistryResponse(source: string): Record<string, unknown> {
  let data: unknown;
  try {
    data = parseNested(JSON.parse(source));
  } catch (error) {
    throw new ParseError('The registry returned an invalid JSON response', { cause: error });
  }
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new ParseError('The registry response must be an object');
  return data as Record<string, unknown>;
}
