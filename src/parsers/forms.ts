import type { CheerioAPI } from 'cheerio';
import type { FormField, PublicForm } from '../types.js';
import { resolveUrl } from '../core/url.js';
import { cleanText, type Selection } from './dom.js';

export function extractForms($: CheerioAPI, root: Selection, base: string): PublicForm[] {
  return root
    .find('form')
    .toArray()
    .map((element) => {
      const form = $(element);
      const fields: FormField[] = form
        .find('input, select, textarea, button')
        .toArray()
        .map((field) => {
          const node = $(field);
          const id = node.attr('id') ?? null;
          const label = id
            ? $('label')
                .filter((_, item) => $(item).attr('for') === id)
                .first()
                .text()
            : '';
          return {
            id,
            name: node.attr('name') ?? null,
            label: cleanText(
              label ||
                node.closest('label').text() ||
                node.attr('aria-label') ||
                node.attr('placeholder') ||
                node.attr('title') ||
                '',
            ),
            type: node.attr('type') ?? ('name' in field ? field.name : 'text'),
            value: String(node.val() ?? node.attr('value') ?? ''),
            required: node.is('[required], [aria-required="true"]'),
            disabled: node.is(':disabled'),
            checked: node.is(':checked'),
            options: node
              .find('option')
              .toArray()
              .map((option) => ({
                label: cleanText($(option).text()),
                value: $(option).attr('value') ?? $(option).text(),
                selected: $(option).is(':selected'),
              })),
          };
        });
      return {
        id: form.attr('id') ?? null,
        action: resolveUrl(form.attr('action') || base, base) ?? base,
        method: (form.attr('method') ?? 'get').toUpperCase(),
        fields,
        requiresCaptcha:
          form.find('.mtcaptcha, .g-recaptcha, [name*="captcha"], [id*="captcha"]').length > 0,
        usesJavaScript:
          !!form.attr('onsubmit') || fields.some((field) => field.type === 'text' && !field.name),
      };
    });
}
