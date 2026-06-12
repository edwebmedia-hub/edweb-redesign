const anthropic = require('./anthropic');
const openrouter = require('./openrouter');

const SYSTEM_PROMPT = `You are a content-editing assistant for a CMS.
The page is made of immutable, locked design/template plus a fixed set of editable "slots".
You can ONLY change the values of existing slots - you cannot add, remove, or restructure anything.

Slot value shapes by type:
- "text": a plain string (no HTML).
- "image": { "src": string, "alt": string }
- "link": { "text": string|null, "href": string }  (text is null for image-only links)
- "button": { "text": string }

Respond with ONLY a single JSON object, no markdown fences, no commentary outside the JSON, in this exact shape:
{
  "changes": [ { "slotId": "<existing slot id>", "value": <new value matching the slot's type> } ],
  "reply": "<short, friendly explanation of what you changed, for the user>"
}

Rules:
- Only reference slotIds that exist in the provided slot list.
- If the request can't be satisfied by editing existing slots, return "changes": [] and explain why in "reply".
- Never leave a required slot empty.
- Keep "reply" short (1-3 sentences).`;

function buildPrompt(slotsForPrompt, message) {
  return [
    'Editable slots (id, type, current value):',
    JSON.stringify(slotsForPrompt, null, 2),
    '',
    `User request: ${message}`,
  ].join('\n');
}

function slotsForPrompt(page, content) {
  return Object.values(page.slots || {}).map((slot) => ({
    slotId: slot.id,
    type: slot.type,
    required: !!slot.required,
    value: content[slot.id] !== undefined ? content[slot.id] : null,
  }));
}

function extractJson(text) {
  // Strip markdown fences if the model added them despite instructions.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('AI response did not contain JSON');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

/**
 * Turn a plain-English request into a structured slot-change proposal.
 * Does NOT apply anything - the caller must run the result through the Guardian.
 *
 * @returns {Promise<{ changes: Array<{slotId:string, value:any}>, reply: string }>}
 */
async function proposeChange({ page, content, message, provider, apiKey, model }) {
  const prompt = buildPrompt(slotsForPrompt(page, content), message);

  let raw;
  if (provider === 'openrouter') {
    raw = await openrouter.complete({ apiKey, model, system: SYSTEM_PROMPT, prompt });
  } else if (provider === 'anthropic') {
    raw = await anthropic.complete({ apiKey, model, system: SYSTEM_PROMPT, prompt });
  } else {
    throw new Error(`Unknown AI provider: ${provider}`);
  }

  let parsed;
  try {
    parsed = extractJson(raw);
  } catch (err) {
    throw new Error(`Could not parse AI response as JSON: ${err.message}`);
  }

  if (!Array.isArray(parsed.changes)) parsed.changes = [];
  if (typeof parsed.reply !== 'string') parsed.reply = '';

  return { changes: parsed.changes, reply: parsed.reply };
}

module.exports = { proposeChange };
