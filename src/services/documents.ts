import { routes } from '../routes.js';
import type { DocumentLink, Download, RequestOptions } from '../types.js';
import type { PagesService } from './pages.js';

export class DocumentsService {
  constructor(private readonly pages: PagesService) {}

  async list(path: string, options: RequestOptions = {}): Promise<DocumentLink[]> {
    return (await this.pages.get(path, options)).documents;
  }

  async download(url: string, options: RequestOptions = {}): Promise<Download> {
    const response = await this.pages.transport.get(url, options);
    const disposition = response.headers.get('content-disposition') ?? '';
    const extended = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
    const quoted = /filename="([^"]+)"/i.exec(disposition)?.[1];
    const plain = /filename=([^;]+)/i.exec(disposition)?.[1];
    const segments = new URL(response.url).pathname.split(routes.home).filter(Boolean);
    const pathName =
      segments.findLast((segment) => /\.[a-z\d]{2,6}$/i.test(segment)) ?? segments.at(-1);
    let filename = extended ?? quoted ?? plain ?? pathName ?? 'download';
    try {
      filename = decodeURIComponent(filename);
    } catch {}
    filename = filename.replace(/[\x00-\x1f\x7f/\\]/g, '_').trim();
    if (!filename || filename === '.' || filename === '..') filename = 'download';
    return {
      url: response.url,
      filename,
      contentType: response.headers.get('content-type') ?? 'application/octet-stream',
      bytes: response.bytes,
    };
  }
}
