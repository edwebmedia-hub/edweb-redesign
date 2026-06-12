const cheerio = require('cheerio');

// Tags whose own text content (when they have no element children) becomes an
// editable "text" slot.
const TEXT_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'span', 'li', 'td', 'th', 'figcaption', 'blockquote',
  'label', 'dt', 'dd', 'strong', 'em', 'small', 'div', 'caption', 'legend',
]);

// Tags that should never be parsed/kept as part of the live template.
const STRIP_TAGS = ['script', 'noscript'];

// Top-level structural containers used by the Guardian to make sure an edit
// never empties out an entire page section.
const STRUCTURAL_TAGS = new Set(['header', 'nav', 'main', 'footer', 'section', 'article', 'aside']);

/**
 * Fetch a URL and run it through ingestHtml().
 */
async function ingestUrl(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ClientCMS-Ingest/1.0)' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  return ingestHtml(html, url);
}

/**
 * Parse raw HTML, tag every editable text/image/button/link node with a
 * stable `data-slot-id`, and return:
 *  - template: { html, structure }  -- the frozen, locked template
 *  - slots:    { [slotId]: slotDefinition }
 *  - content:  { [slotId]: initialValue }  -- becomes content version 1
 */
function ingestHtml(html, sourceUrl) {
  const $ = cheerio.load(html, { decodeEntities: false });

  // Remove anything that can execute code or carry inline handlers.
  $(STRIP_TAGS.join(',')).remove();
  $('*').each((_, el) => {
    if (!el.attribs) return;
    for (const attr of Object.keys(el.attribs)) {
      if (/^on/i.test(attr)) delete el.attribs[attr];
      if (attr === 'href' && /^\s*javascript:/i.test(el.attribs[attr] || '')) {
        el.attribs[attr] = '#';
      }
    }
  });

  const slots = {};
  const content = {};
  const counters = { text: 0, image: 0, link: 0, button: 0, section: 0 };

  const nextId = (type) => `${type}-${++counters[type]}`;

  function tagSlot(el, $el, type, def, value) {
    const id = nextId(type);
    $el.attr('data-slot-id', id);
    slots[id] = { id, type, tag: el.tagName ? el.tagName.toLowerCase() : null, ...def };
    content[id] = value;
    return id;
  }

  function walk(el) {
    const tag = el.tagName ? el.tagName.toLowerCase() : null;
    if (!tag || STRIP_TAGS.includes(tag)) return [];

    const $el = $(el);
    const elementChildren = $el.children().toArray().filter((c) => c.tagName);

    if (tag === 'img') {
      const id = tagSlot(el, $el, 'image', {}, {
        src: $el.attr('src') || '',
        alt: $el.attr('alt') || '',
      });
      return [id];
    }

    if (tag === 'a') {
      if (elementChildren.length === 0) {
        const text = $el.text().trim();
        if (text) {
          const id = tagSlot(el, $el, 'link', {}, {
            text,
            href: $el.attr('href') || '',
          });
          return [id];
        }
        return [];
      }
      // Anchor wraps other elements (e.g. <a href="..."><img/></a>).
      // Tag the anchor itself as an href-only "link" slot, then recurse.
      const id = tagSlot(el, $el, 'link', { hrefOnly: true }, {
        text: null,
        href: $el.attr('href') || '',
      });
      const childIds = elementChildren.flatMap(walk);
      return [id, ...childIds];
    }

    if (tag === 'button' || (tag === 'input' && ['button', 'submit', 'reset'].includes(($el.attr('type') || '').toLowerCase()))) {
      const isInput = tag === 'input';
      const text = isInput ? ($el.attr('value') || '') : $el.text().trim();
      if (!text) return [];
      const id = tagSlot(el, $el, 'button', { isInput }, { text });
      return [id];
    }

    if (elementChildren.length === 0) {
      if (TEXT_TAGS.has(tag)) {
        const text = $el.text().trim();
        if (text) {
          const id = tagSlot(el, $el, 'text', {}, text);
          return [id];
        }
      }
      return [];
    }

    return elementChildren.flatMap(walk);
  }

  const topLevelIds = $('body').children().toArray().flatMap(walk);

  // Build structural sections so the Guardian can refuse to empty one out.
  const sections = [];
  $(Array.from(STRUCTURAL_TAGS).join(',')).each((_, el) => {
    const $el = $(el);
    const slotIds = [];
    $el.find('[data-slot-id]').each((__, slotEl) => {
      slotIds.push($(slotEl).attr('data-slot-id'));
    });
    if ($el.is('[data-slot-id]')) slotIds.unshift($el.attr('data-slot-id'));
    if (slotIds.length === 0) return;
    sections.push({
      id: `section-${++counters.section}`,
      tag: el.tagName.toLowerCase(),
      slotIds: [...new Set(slotIds)],
    });
  });

  // Mark slots that are the sole content of a structural section as required:
  // emptying them would leave that section completely blank.
  for (const section of sections) {
    if (section.slotIds.length === 1) {
      const slot = slots[section.slotIds[0]];
      if (slot) slot.required = true;
    }
  }

  return {
    template: {
      html: $.html(),
      structure: { sections, topLevelIds },
    },
    slots,
    content,
    sourceUrl,
    slotOrder: Object.keys(slots),
  };
}

module.exports = { ingestUrl, ingestHtml };
