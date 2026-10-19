// Servidor estático mínimo para o Railway.
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8'};
http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = path.join(ROOT, path.normalize(url).replace(/^(\.\.[/\\])+/, ''));
  if (url === '/' || url.endsWith('/')) file = path.join(ROOT, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) { fs.readFile(path.join(ROOT, 'index.html'), (e2, d2) => { if (e2) { res.writeHead(404); return res.end('Not found'); } res.writeHead(200, {'Content-Type': TYPES['.html']}); res.end(d2); }); return; }
    const ext = path.extname(file).toLowerCase();
    const headers = {'Content-Type': TYPES[ext] || 'application/octet-stream'};
    headers['Cache-Control'] = ext === '.html' || file.endsWith('sw.js') ? 'no-cache' : 'public, max-age=86400';
    res.writeHead(200, headers); res.end(data);
  });
}).listen(PORT, () => console.log('Mundo da Luize rodando na porta ' + PORT));
