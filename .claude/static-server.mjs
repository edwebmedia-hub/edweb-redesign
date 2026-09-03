// Minimal static file server: node static-server.mjs <port> <dir>
// Used for previews because `python -m http.server` drops files >100KB on this machine.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';

const port = Number(process.argv[2] || 4200);
const root = process.argv[3] || '.';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.pdf': 'application/pdf', '.mp4': 'video/mp4',
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(root, path));
    if (!normalize(file).startsWith(normalize(root))) { res.writeHead(403); return res.end(); }
    let data;
    try {
      data = await readFile(file);
    } catch {
      // clean-URL fallback: /about -> /about.html
      try {
        data = await readFile(file + '.html');
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        return res.end(data);
      } catch {
        try {
          const nf = await readFile(join(root, '404.html'));
          res.writeHead(404, { 'Content-Type': MIME['.html'] });
          return res.end(nf);
        } catch {
          res.writeHead(404); return res.end('Not found');
        }
      }
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    res.writeHead(500); res.end('Server error');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`static server on http://127.0.0.1:${port} serving ${root}`);
});
