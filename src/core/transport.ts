import { RateLimiter } from './http/rate-limiter.js';
import { copyResponse, decodeResponse, readBytes } from './http/response.js';
import { retryableStatuses, retryWait } from './http/retry.js';
import type { TransportOptions, HttpResponse } from './http/types.js';
import { setTimeout as delay } from 'node:timers/promises';
import { CookieJar } from 'tough-cookie';
import { MemoryCache } from './cache.js';
import { HttpError, ValidationError } from './errors.js';
import { nonNegative, normalizeUrl, positiveInteger } from './url.js';
import type { RequestOptions } from '../types.js';

export type { TransportOptions, HttpResponse } from './http/types.js';

export class Transport {
  readonly baseUrl: string;
  readonly cookieJar: CookieJar;
  private readonly origins: Set<string>;
  private readonly fetcher: typeof globalThis.fetch;
  private readonly headers: Headers;
  private readonly cache: MemoryCache<HttpResponse>;
  private readonly timeout: number;
  private readonly retries: number;
  private readonly retryDelay: number;
  private readonly limiter: RateLimiter;
  private readonly maxBytes: number;

  constructor(options: TransportOptions = {}) {
    const base = new URL(options.baseUrl ?? 'https://portal.nebih.gov.hu/');
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) {
      throw new ValidationError('baseUrl must be an HTTP(S) URL without credentials');
    }
    this.baseUrl = base.href;
    this.origins = new Set([
      base.origin,
      ...(options.allowedOrigins ?? []).map((value) => new URL(value).origin),
    ]);
    this.fetcher = options.fetch ?? globalThis.fetch;
    this.headers = new Headers(options.headers);
    if (!this.headers.has('User-Agent')) this.headers.set('User-Agent', 'nebih-portal/0.1');
    if (!this.headers.has('Accept-Language')) this.headers.set('Accept-Language', 'hu-HU,hu;q=0.9');
    this.cookieJar = options.cookieJar ?? new CookieJar();
    this.timeout = positiveInteger(options.timeoutMs ?? 30_000, 'timeoutMs');
    this.retries = nonNegative(options.retries ?? 2, 'retries');
    if (!Number.isSafeInteger(this.retries))
      throw new ValidationError('retries must be an integer');
    this.retryDelay = nonNegative(options.retryDelayMs ?? 500, 'retryDelayMs');
    this.limiter = new RateLimiter(nonNegative(options.minIntervalMs ?? 300, 'minIntervalMs'));
    this.maxBytes = positiveInteger(
      options.maxResponseBytes ?? 25 * 1024 * 1024,
      'maxResponseBytes',
    );
    const size = nonNegative(options.cacheSize ?? 100, 'cacheSize');
    if (!Number.isSafeInteger(size)) throw new ValidationError('cacheSize must be an integer');
    this.cache = new MemoryCache(nonNegative(options.cacheTtlMs ?? 60_000, 'cacheTtlMs'), size);
  }

  resolve(path: string): string {
    const url = new URL(path, this.baseUrl);
    const base = new URL(this.baseUrl);
    if (base.protocol === 'https:' && url.protocol === 'http:' && url.host === base.host)
      url.protocol = 'https:';
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !this.origins.has(url.origin) ||
      url.username ||
      url.password
    ) {
      throw new ValidationError(`URL origin is not allowed: ${url.origin}`);
    }
    url.hash = '';
    return url.href;
  }

  clearCache(): void {
    this.cache.clear();
  }

  async get(path: string, options: RequestOptions = {}): Promise<HttpResponse> {
    options.signal?.throwIfAborted();
    const url = this.resolve(path);
    const key = normalizeUrl(url);
    const cached = options.fresh ? undefined : this.cache.get(key);
    if (cached) return copyResponse(cached);
    const response = await this.request(url, 'GET', undefined, options);
    this.cache.set(key, response);
    return copyResponse(response);
  }

  async postForm(
    path: string,
    fields: URLSearchParams,
    options: RequestOptions = {},
  ): Promise<HttpResponse> {
    return this.request(this.resolve(path), 'POST', fields.toString(), options);
  }

  decode(response: HttpResponse): string {
    return decodeResponse(response);
  }

  private async request(
    url: string,
    method: 'GET' | 'POST',
    body: string | undefined,
    options: RequestOptions,
  ): Promise<HttpResponse> {
    for (let attempt = 0; ; attempt++) {
      const timeout = AbortSignal.timeout(this.timeout);
      const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
      await this.limiter.reserve(signal);
      try {
        let current = url;
        for (let redirect = 0; redirect <= 5; redirect++) {
          const headers = new Headers(this.headers);
          const cookies = await this.cookieJar.getCookieString(current);
          if (cookies) headers.set('Cookie', cookies);
          if (body !== undefined)
            headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
          const response = await this.fetcher(current, {
            method,
            headers,
            signal,
            redirect: 'manual',
            ...(body === undefined ? {} : { body }),
          });
          for (const cookie of response.headers.getSetCookie()) {
            await this.cookieJar.setCookie(cookie, current, { ignoreError: true });
          }
          if ([301, 302, 303, 307, 308].includes(response.status)) {
            await response.body?.cancel();
            const location = response.headers.get('location');
            if (!location || redirect === 5) throw new HttpError(response.status, current);
            const target = this.resolve(new URL(location, current).href);
            if (method !== 'GET') throw new HttpError(response.status, current);
            current = target;
            continue;
          }
          if (!response.ok) {
            await response.body?.cancel();
            if (
              method === 'GET' &&
              attempt < this.retries &&
              retryableStatuses.has(response.status)
            ) {
              await delay(
                retryWait(response, attempt, this.retryDelay),
                undefined,
                options.signal ? { signal: options.signal } : {},
              );
              break;
            }
            throw new HttpError(response.status, current);
          }
          const bytes = await readBytes(response, signal, this.maxBytes);
          return { url: current, headers: new Headers(response.headers), bytes };
        }
      } catch (error) {
        if (signal.aborted) throw signal.reason;
        if (method !== 'GET' || attempt >= this.retries || !(error instanceof TypeError))
          throw error;
        await delay(
          this.retryDelay * 2 ** attempt,
          undefined,
          options.signal ? { signal: options.signal } : {},
        );
      }
    }
  }
}
