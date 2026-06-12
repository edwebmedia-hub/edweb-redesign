/**
 * The Guardian.
 *
 * A deterministic (no AI) gate that every proposed content change must pass
 * through before it is written to a new version. It knows nothing about
 * "intent" - it only checks structure, types, and safety:
 *
 *  - every changed slotId must exist on the page
 *  - the new value must match the slot's expected shape
 *  - text/url values are sanitized (no script injection, sane lengths)
 *  - a slot marked `required`, or a structural section, can never end up
 *    completely empty as a result of the change
 */

const LIMITS = {
  text: 10000,
  linkText: 500,
  buttonText: 200,
  href: 2000,
  src: 2000,
  alt: 300,
};

const SAFE_URL_RE = /^(https?:\/\/|\/|#|\.\.?\/|mailto:|tel:)/i;
const SAFE_IMAGE_SRC_RE = /^(https?:\/\/|\/|\.\.?\/|data:image\/)/i;

function stripTags(value) {
  return String(value).replace(/<\/?[^>]*>/g, '');
}

function isSafeUrl(url, re) {
  if (typeof url !== 'string') return false;
  if (/^\s*javascript:/i.test(url)) return false;
  if (url.trim() === '') return true; // empty is allowed at the type level; emptiness rules handled separately
  return re.test(url.trim());
}

/**
 * Returns true if `value` represents an "empty" slot for its type.
 */
function isEmptyValue(slot, value) {
  switch (slot.type) {
    case 'text':
      return !value || !String(value).trim();
    case 'image':
      return !value || !value.src || !String(value.src).trim();
    case 'link':
      if (slot.hrefOnly) return !value || !value.href || !String(value.href).trim();
      return (!value || !value.text || !String(value.text).trim()) && (!value || !value.href || !String(value.href).trim());
    case 'button':
      return !value || !value.text || !String(value.text).trim();
    default:
      return true;
  }
}

/**
 * Validate + sanitize a single proposed slot value. Returns
 * { ok: true, value } or { ok: false, error }.
 */
function validateSlotValue(slot, rawValue) {
  switch (slot.type) {
    case 'text': {
      if (typeof rawValue !== 'string') return { ok: false, error: `Slot ${slot.id}: expected a string` };
      const clean = stripTags(rawValue).trim();
      if (clean.length > LIMITS.text) return { ok: false, error: `Slot ${slot.id}: text exceeds ${LIMITS.text} characters` };
      return { ok: true, value: clean };
    }

    case 'image': {
      if (typeof rawValue !== 'object' || rawValue === null || Array.isArray(rawValue)) {
        return { ok: false, error: `Slot ${slot.id}: expected an object with src/alt` };
      }
      const src = rawValue.src !== undefined ? String(rawValue.src) : '';
      const alt = rawValue.alt !== undefined ? String(rawValue.alt) : '';
      if (src.length > LIMITS.src) return { ok: false, error: `Slot ${slot.id}: image src too long` };
      if (alt.length > LIMITS.alt) return { ok: false, error: `Slot ${slot.id}: image alt too long` };
      if (!isSafeUrl(src, SAFE_IMAGE_SRC_RE)) return { ok: false, error: `Slot ${slot.id}: unsafe or invalid image src` };
      return { ok: true, value: { src: src.trim(), alt: stripTags(alt).trim() } };
    }

    case 'link': {
      if (typeof rawValue !== 'object' || rawValue === null || Array.isArray(rawValue)) {
        return { ok: false, error: `Slot ${slot.id}: expected an object with text/href` };
      }
      const href = rawValue.href !== undefined ? String(rawValue.href) : '';
      if (href.length > LIMITS.href) return { ok: false, error: `Slot ${slot.id}: href too long` };
      if (!isSafeUrl(href, SAFE_URL_RE)) return { ok: false, error: `Slot ${slot.id}: unsafe or invalid href` };

      if (slot.hrefOnly) {
        return { ok: true, value: { text: null, href: href.trim() } };
      }
      const text = rawValue.text !== undefined && rawValue.text !== null ? stripTags(String(rawValue.text)).trim() : '';
      if (text.length > LIMITS.linkText) return { ok: false, error: `Slot ${slot.id}: link text too long` };
      return { ok: true, value: { text, href: href.trim() } };
    }

    case 'button': {
      if (typeof rawValue !== 'object' || rawValue === null || Array.isArray(rawValue)) {
        return { ok: false, error: `Slot ${slot.id}: expected an object with text` };
      }
      const text = stripTags(String(rawValue.text || '')).trim();
      if (text.length > LIMITS.buttonText) return { ok: false, error: `Slot ${slot.id}: button text too long` };
      return { ok: true, value: { text } };
    }

    default:
      return { ok: false, error: `Slot ${slot.id}: unknown slot type "${slot.type}"` };
  }
}

/**
 * Run a proposed change set through the Guardian.
 *
 * @param {object} page - the page record (must have `slots` and `template.structure`)
 * @param {object} currentContent - current { [slotId]: value } map
 * @param {Array<{slotId: string, value: any}>} changes - proposed changes
 * @returns {{ ok: boolean, errors: string[], content?: object, sanitized?: Array }}
 */
function runGuardian(page, currentContent, changes) {
  const errors = [];

  if (!Array.isArray(changes) || changes.length === 0) {
    return { ok: false, errors: ['No changes proposed'] };
  }

  const slots = page.slots || {};
  const sanitized = [];
  const nextContent = { ...currentContent };

  for (const change of changes) {
    if (!change || typeof change !== 'object' || typeof change.slotId !== 'string') {
      errors.push('Malformed change: each change needs a slotId');
      continue;
    }
    const slot = slots[change.slotId];
    if (!slot) {
      errors.push(`Unknown slot id: ${change.slotId}`);
      continue;
    }

    const result = validateSlotValue(slot, change.value);
    if (!result.ok) {
      errors.push(result.error);
      continue;
    }

    if (slot.required && isEmptyValue(slot, result.value)) {
      errors.push(`Slot ${slot.id} is required and cannot be emptied`);
      continue;
    }

    sanitized.push({ slotId: slot.id, value: result.value });
    nextContent[slot.id] = result.value;
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Structural-section check: never let a whole section go empty.
  const sections = (page.template && page.template.structure && page.template.structure.sections) || [];
  for (const section of sections) {
    const allEmpty = section.slotIds.every((slotId) => {
      const slot = slots[slotId];
      if (!slot) return true;
      return isEmptyValue(slot, nextContent[slotId]);
    });
    if (allEmpty) {
      errors.push(`Change rejected: section "${section.id}" (<${section.tag}>) would become completely empty`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, errors: [], content: nextContent, sanitized };
}

module.exports = { runGuardian, validateSlotValue, isEmptyValue };
