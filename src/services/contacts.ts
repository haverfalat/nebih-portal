import { routes } from '../routes.js';
import type { Link, RequestOptions } from '../types.js';
import type { PagesService } from './pages.js';

export interface Contact {
  name: string;
  emails: string[];
  phones: string[];
  text: string;
  html: string;
  links: Link[];
}

export class ContactsService {
  constructor(private readonly pages: PagesService) {}

  async list(path: string = routes.offices, options: RequestOptions = {}): Promise<Contact[]> {
    const page = await this.pages.get(path, options);
    return page.accordions.map((section) => ({
      name: section.title,
      emails: [
        ...new Set([
          ...section.links
            .filter((link) => link.url.startsWith('mailto:'))
            .map((link) => decodeURIComponent(link.url.slice(7).split('?')[0] ?? '')),
          ...(section.text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) ?? []),
        ]),
      ],
      phones: [
        ...new Set([
          ...section.links
            .filter((link) => link.url.startsWith('tel:'))
            .map((link) => link.url.slice(4)),
          ...(section.text.match(/(?:\+36|06)[\s(/.-]*\d{1,2}[\s)/.-]*\d{3}[\s.-]*\d{3,4}/g) ?? []),
        ]),
      ],
      text: section.text,
      html: section.html,
      links: section.links,
    }));
  }
}
