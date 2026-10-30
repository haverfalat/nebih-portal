import { ResponseTooLargeError } from '../errors.js';
import type { HttpResponse } from './types.js';

export function copyResponse(response: HttpResponse): HttpResponse {
  return {
    url: response.url,
    headers: new Headers(response.headers),
    bytes: response.bytes.slice(),
  };
}

export function decodeResponse(response: HttpResponse): string {
  const charset =
    /charset=["']?([^\s;"']+)/i.exec(response.headers.get('content-type') ?? '')?.[1] ?? 'utf-8';
  return new TextDecoder(charset).decode(response.bytes);
}

export async function readBytes(
  response: Response,
  signal: AbortSignal,
  maxBytes: number,
): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      signal.throwIfAborted();
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > maxBytes) throw new ResponseTooLargeError(`Response exceeds ${maxBytes} bytes`);
      chunks.push(chunk.value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}
