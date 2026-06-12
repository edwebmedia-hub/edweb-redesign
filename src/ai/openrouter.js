const config = require('../config');

/**
 * Send a single-turn prompt to the OpenRouter chat completions API and
 * return the raw text of the reply.
 */
async function complete({ apiKey, model, system, prompt }) {
  const key = apiKey || config.openrouterApiKey;
  if (!key) throw new Error('No OpenRouter API key configured');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: model || config.openrouterModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
}

module.exports = { complete };
