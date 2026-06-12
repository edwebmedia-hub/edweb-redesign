const cheerio = require('cheerio');

/**
 * Combine a frozen template with a content map to produce final HTML.
 * The template structure (and everything not tagged with data-slot-id)
 * is locked - only the values inside tagged slots are substituted.
 *
 * @param {{html: string}} template
 * @param {object} content - { [slotId]: value }
 * @param {{ stripSlotAttrs?: boolean, editable?: boolean }} [options]
 */
function renderPage(template, content, options = {}) {
  const $ = cheerio.load(template.html, { decodeEntities: false });

  $('[data-slot-id]').each((_, el) => {
    const $el = $(el);
    const id = $el.attr('data-slot-id');
    const value = content[id];
    if (value === undefined || value === null) return;

    const tag = el.tagName.toLowerCase();

    if (tag === 'img') {
      $el.attr('src', value.src || '');
      $el.attr('alt', value.alt || '');
    } else if (tag === 'a') {
      if (value.href !== undefined) $el.attr('href', value.href || '#');
      if (value.text !== null && value.text !== undefined) {
        $el.text(value.text);
      }
    } else if (tag === 'input') {
      $el.attr('value', (value && value.text) || '');
    } else if (tag === 'button') {
      $el.text((value && value.text) || '');
    } else {
      $el.text(typeof value === 'string' ? value : String(value ?? ''));
    }

    if (options.stripSlotAttrs) {
      $el.removeAttr('data-slot-id');
    }
  });

  return $.html();
}

module.exports = { renderPage };
