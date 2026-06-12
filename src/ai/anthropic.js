const config = require('../config');

/**
 * Send a single-turn prompt to the Anthropic Messages API and return the
 * raw text of the reply.
 */
async function complete({ apiKey, model, system, prompt }) {
  const key = apiKey || config.anthropicApiKey;
  if (!key) throw new Error('No Anthropic API key configured');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || config.anthropicModel,
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return (data.content || []).map((b) => b.text || '').join('');
}

module.exports = { complete };
