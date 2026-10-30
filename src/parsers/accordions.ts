import type { CheerioAPI } from 'cheerio';
import type { Accordion } from '../types.js';
import { cleanText, extractLinks, textContent, type Selection } from './dom.js';

export function extractAccordions($: CheerioAPI, root: Selection, base: string): Accordion[] {
  const result: Accordion[] = [];
  root
    .find(
      '.toggler-header, details > summary, [data-toggle="collapse"][href], [data-bs-toggle="collapse"][data-bs-target]',
    )
    .each((_, element) => {
      const heading = $(element);
      let content: Selection = heading.next('.toggler-content-wrapper, .toggler-content');
      if (heading.is('summary'))
        content = heading.parent().clone().children('summary').remove().end();
      if (!content.length) {
        const target = heading.attr('data-bs-target') ?? heading.attr('href');
        if (target?.startsWith('#'))
          content = root.find('[id]').filter((_, node) => $(node).attr('id') === target.slice(1));
      }
      if (!content.length) return;
      result.push({
        title: cleanText(heading.text()),
        id: heading.attr('id') ?? null,
        text: textContent(content),
        html: content.html() ?? '',
        links: extractLinks($, content, base),
      });
    });
  return result;
}
