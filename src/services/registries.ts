import { CaptchaRequiredError, ValidationError } from '../core/errors.js';
import { createDom } from '../parsers/dom.js';
import { parsePage } from '../parsers/page.js';
import { registryPath } from '../registries/paths.js';
import { buildRegistryQuery } from '../registries/query.js';
import { parseRegistryResponse } from '../registries/response.js';
import type {
  RegistryName,
  RegistryQuery,
  RegistryDescription,
  RegistryResult,
} from '../registries/types.js';
import type { Page, RequestOptions } from '../types.js';
import type { PagesService } from './pages.js';

export class RegistriesService {
  constructor(private readonly pages: PagesService) {}

  page(name: RegistryName, options: RequestOptions = {}): Promise<Page> {
    return this.pages.get(registryPath(name), options);
  }

  async describe(name: RegistryName, options: RequestOptions = {}): Promise<RegistryDescription> {
    const path = registryPath(name);
    const source = await this.pages.source(path, options);
    const $ = createDom(source.html);
    const endpoints: Record<string, string> = {};
    const scripts = $('script:not([src])')
      .toArray()
      .map((element) => $(element).text())
      .join('\n');
    const pattern =
      /\b(search\w*(?:URL|Url)|datatableUrl|exportPdfURL)\s*=\s*['"]([^'"\r\n]+)['"]/g;
    for (const match of scripts.matchAll(pattern)) {
      if (match[1] && match[2])
        endpoints[match[1]] = this.pages.transport.resolve(match[2].replace(/&amp;/g, '&'));
    }
    const page = parsePage(source.html, source.url);
    return {
      name,
      url: source.url,
      requiresCaptcha: page.forms.some((form) => form.requiresCaptcha),
      forms: page.forms,
      endpoints,
    };
  }

  async lookup(
    name: RegistryName,
    query: RegistryQuery,
    captchaToken: string,
    options: RequestOptions = {},
  ): Promise<RegistryResult> {
    if (!captchaToken?.trim())
      throw new CaptchaRequiredError(
        'A token from a user-completed CAPTCHA in the same session is required',
      );
    const request = buildRegistryQuery(query);
    const registry = await this.describe(name, options);
    const endpoint = request.endpoints.map((key) => registry.endpoints[key]).find(Boolean);
    if (!endpoint) throw new ValidationError(`${query.type} lookup is not available in ${name}`);
    request.fields.set('mtcaptcha-verifiedtoken', captchaToken);
    const response = await this.pages.transport.postForm(endpoint, request.fields, options);
    return {
      url: response.url,
      data: parseRegistryResponse(this.pages.transport.decode(response)),
    };
  }
}
