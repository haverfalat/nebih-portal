export const retryableStatuses = new Set([408, 429, 500, 502, 503, 504]);

export function retryWait(response: Response, attempt: number, retryDelay: number): number {
  const value = response.headers.get('retry-after');
  const seconds = value === null ? NaN : Number(value);
  const wait = Number.isFinite(seconds)
    ? seconds * 1000
    : value
      ? Date.parse(value) - Date.now()
      : NaN;
  return Math.min(30_000, Math.max(0, Number.isFinite(wait) ? wait : retryDelay * 2 ** attempt));
}
