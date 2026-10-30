import type { CookieJar } from 'tough-cookie';

export interface TransportOptions {
  baseUrl?: string;
  allowedOrigins?: string[];
  fetch?: typeof globalThis.fetch;
  headers?: HeadersInit;
  cookieJar?: CookieJar;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  minIntervalMs?: number;
  cacheTtlMs?: number;
  cacheSize?: number;
  maxResponseBytes?: number;
}

export interface HttpResponse {
  url: string;
  headers: Headers;
  bytes: Uint8Array;
}
