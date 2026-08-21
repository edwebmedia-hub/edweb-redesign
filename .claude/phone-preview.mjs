// Phone preview: serves the site to any device on the same wifi, with the same
// clean URLs the host uses, so /packages works exactly as it will once live.
//
//   node .claude/phone-preview.mjs [port] [dir]
//
// Prints the address to type into a phone browser. Nothing is published and
// nothing touches the live domain.
import http from 'node:http';
import { promises as fs } from 'node:fs';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const port = Number(process.argv[2] || 4180);
const root = path.resolve(process.argv[3] || 'redesign');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.woff2': 'font/woff2', '.woff': 'font/woff'
};

/* The drafts still live at new-*.html. Map the real URLs onto them so the phone
   sees exactly the addresses the site will have after promotion. */
const ROUTES = {
  '/': 'new-home.html',
  '/projects': 'new-projects.html',
  '/packages': 'new-packages.html',
  '/contact': 'new-contact.html',
  '/pay': 'new-pay.html',
  '/terms-conditions': 'new-terms.html',
  '/privacy-policy': 'new-privacy.html',
  '/projects/navigator': 'new-project-navigator.html',
  '/projects/crazydaizy': 'new-project-crazydaizy.html',
  '/projects/tee-to-trail': 'new-project-teetotrail.html',
  '/projects/spiralguard': 'new-project-spiralguard.html',
  '/projects/lekkerdoos': 'new-project-lekkerdoos.html',
  '/projects/muire': 'new-project-muire.html'
};

const resolve = (urlPath) => {
  if (ROUTES[urlPath]) return path.join(root, ROUTES[urlPath]);
  let p = path.join(root, urlPath);
  if (existsSync(p) && statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (existsSync(p)) return p;
  if (existsSync(p + '.html')) return p + '.html';
  /* Project pages will sit in projects/ and reach assets with ../ after
     promotion. The drafts still sit at the root, so let a nested request fall
     back to the root file rather than 404 a perfectly good image. */
  const flat = path.join(root, urlPath.replace(/^\/projects\//, '/'));
  if (existsSync(flat)) return flat;
  return null;
};

http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]).replace(/\/+$/, '') || '/';
  const file = resolve(urlPath);
  if (!file) {
    const nf = path.join(root, '404.html');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(existsSync(nf) ? await fs.readFile(nf) : 'Not found');
  }
  try {
    const body = await fs.readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(body);
  } catch {
    res.writeHead(500).end('Server error');
  }
}).listen(port, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
  console.log('Phone preview running. Serving: ' + root);
  console.log('');
  console.log('  On this PC:   http://localhost:' + port + '/');
  ips.forEach((ip) => console.log('  On your phone: http://' + ip + ':' + port + '/'));
  console.log('');
  console.log('Phone must be on the same wifi. Nothing is published.');
  console.log('Pages: / /projects /packages /contact /pay /terms-conditions /privacy-policy');
});
