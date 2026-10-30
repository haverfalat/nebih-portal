import type { CheerioAPI } from 'cheerio';
import type { DataTable, TableCell, TableRow } from '../types.js';
import { cleanText, extractLinks, textContent, type Selection } from './dom.js';

export function extractTables($: CheerioAPI, root: Selection, base: string): DataTable[] {
  return root
    .find('table')
    .toArray()
    .map((element) => {
      const table = $(element);
      const ownRows = table
        .find('tr')
        .filter((_, row) => $(row).closest('table').get(0) === element);
      let headerRow = ownRows.filter('.data-table-head').last();
      if (!headerRow.length)
        headerRow = ownRows
          .filter(
            (_, row) =>
              $(row).parent().is('thead') &&
              $(row).find('th').length > 0 &&
              cleanText($(row).text()).length > 0,
          )
          .last();
      if (!headerRow.length)
        headerRow = ownRows.filter((_, row) => $(row).children('th').length > 0).first();
      const headers = headerRow
        .children('th, td')
        .toArray()
        .map((cell) => cleanText($(cell).text()));
      const rows: TableRow[] = [];
      ownRows.each((_, row) => {
        const node = $(row);
        if (node.get(0) === headerRow.get(0) || node.parent().is('thead, tfoot')) return;
        const cells: TableCell[] = node
          .children('td, th')
          .toArray()
          .map((cell) => ({
            text: textContent($(cell)),
            html: $(cell).html() ?? '',
            links: extractLinks($, $(cell), base),
            rowSpan: Math.max(1, Number($(cell).attr('rowspan')) || 1),
            columnSpan: Math.max(1, Number($(cell).attr('colspan')) || 1),
          }));
        if (!cells.length || !cells.some((cell) => cell.text || cell.links.length)) return;
        rows.push({
          id:
            node.attr('data-record-id') ??
            node
              .find('[id^="new_"]')
              .attr('id')
              ?.match(/_(\d+)$/)?.[1] ??
            node.attr('id') ??
            null,
          cells,
        });
      });
      return {
        id: table.attr('id') ?? null,
        caption: cleanText(table.children('caption').text()) || null,
        headers,
        rows,
      };
    });
}
