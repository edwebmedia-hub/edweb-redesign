// Minimal static file server — replaces python http.server, which stalls on
// this machine when serving files >~100KB (20s per request, connection resets).
// Usage: node .claude/static-server.mjs <port> <directory>
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const port = Number(process.argv[2] || 8080);
const root = path.resolve(process.argv[3] || '.');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.woff2': 'font/woff2', '.woff': 'font/woff'
};

http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const filePath = path.join(root, urlPath);
    if (!filePath.startsWith(root)) { res.writeHead(403).end(); return; }
    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
}).on('error', (e) => console.error('server error:', e.message))
  .listen(port, '127.0.0.1', () => console.log(`serving ${root} on http://127.0.0.1:${port}`));

process.on('uncaughtException', (e) => console.error('uncaught:', e.message));
process.on('unhandledRejection', (e) => console.error('unhandled:', e));
