const crypto = require('crypto');

async function uploadFile(token, teamId, content) {
  const buf = Buffer.from(content, 'utf8');
  const sha = crypto.createHash('sha1').update(buf).digest('hex');
  const url = `https://api.vercel.com/v2/files${teamId ? `?teamId=${teamId}` : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'x-vercel-digest': sha,
    },
    body: buf,
  });
  // 409 = file with this digest already exists, which is fine.
  if (!res.ok && res.status !== 409) {
    throw new Error(`Vercel file upload failed: ${res.status} ${await res.text()}`);
  }
  return { sha, size: buf.length };
}

/**
 * Deploy a static file bundle to Vercel via the REST API.
 *
 * @param {object} opts
 * @param {string} opts.token - Vercel API token
 * @param {string} [opts.teamId] - Vercel team id, if the project is in a team
 * @param {string} opts.projectName - Vercel project name
 * @param {Record<string,string>} opts.files - map of output path -> file content
 * @param {'production'|'staging'} [opts.target]
 */
async function deploy({ token, teamId, projectName, files, target = 'production' }) {
  if (!token) throw new Error('Missing Vercel API token');
  if (!projectName) throw new Error('Missing Vercel project name');

  const fileRefs = [];
  for (const [filePath, content] of Object.entries(files)) {
    const { sha, size } = await uploadFile(token, teamId, content);
    fileRefs.push({ file: filePath, sha, size });
  }

  const url = `https://api.vercel.com/v13/deployments${teamId ? `?teamId=${teamId}` : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      files: fileRefs,
      target,
      projectSettings: { framework: null },
    }),
  });

  if (!res.ok) {
    throw new Error(`Vercel deployment failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    url: data.url ? `https://${data.url}` : null,
    raw: data,
  };
}

module.exports = { deploy };
