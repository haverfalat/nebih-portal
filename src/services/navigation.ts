import { routes } from '../routes.js';
import type { Link, NavigationItem, RequestOptions } from '../types.js';
import { createDom, extractLinks, linkFrom } from '../parsers/dom.js';
import type { PagesService } from './pages.js';
import type { Selection } from '../parsers/dom.js';

export class NavigationService {
  constructor(private readonly pages: PagesService) {}

  async tree(options: RequestOptions = {}): Promise<NavigationItem[]> {
    const source = await this.pages.source(routes.home, options);
    const $ = createDom(source.html);
    const visit = (list: Selection): NavigationItem[] =>
      list
        .children('li')
        .toArray()
        .flatMap((element) => {
          const node = $(element);
          const anchor = node.children('a').first();
          const link = anchor.get(0) ? linkFrom($, anchor.get(0)!, source.url) : null;
          const title = anchor.text().replace(/\s+/g, ' ').trim();
          const children = visit(node.children('ul').add(node.children('div').children('ul')));
          return title
            ? [{ title, url: link?.url ?? source.url, external: link?.external ?? false, children }]
            : [];
        });
    return visit($('#navigation > ul'));
  }

  async links(options: RequestOptions = {}): Promise<Link[]> {
    const source = await this.pages.source(routes.home, options);
    const $ = createDom(source.html);
    return extractLinks($, $('#navigation, footer, .footer-menu'), source.url);
  }
}
