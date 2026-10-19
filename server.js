// Servidor do Mundo da Luize e da Carmel.
// Serve o jogo (pasta public) e cuida do encontro ao vivo entre as princesas (/live).
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const ROOT = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8'};

// nunca derruba o servidor por um socket que caiu
process.on('uncaughtException', e => { try { console.error('aviso:', e && e.message); } catch (x) {} });
process.on('unhandledRejection', () => {});
try { process.stdout.on('error', () => {}); } catch (e) {}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url === '/saude') { res.writeHead(200, {'Content-Type': 'application/json'}); return res.end(JSON.stringify({ok: true, salas: rooms.size, online: [...rooms.values()].reduce((a, s) => a + s.size, 0)})); }
  let file = path.join(ROOT, path.normalize(url).replace(/^(\.\.[/\\])+/, ''));
  if (url === '/' || url.endsWith('/')) file = path.join(ROOT, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) { fs.readFile(path.join(ROOT, 'index.html'), (e2, d2) => { if (e2) { res.writeHead(404); return res.end('Not found'); } res.writeHead(200, {'Content-Type': TYPES['.html']}); res.end(d2); }); return; }
    const ext = path.extname(file).toLowerCase();
    const headers = {'Content-Type': TYPES[ext] || 'application/octet-stream'};
    headers['Cache-Control'] = ext === '.html' || file.endsWith('sw.js') ? 'no-cache' : 'public, max-age=86400';
    res.writeHead(200, headers); res.end(data);
  });
});

// ---------- encontro ao vivo ----------
// Uma sala por código de acesso da família: só quem sabe o código entra na mesma sala.
const rooms = new Map();
const wss = new WebSocketServer({server, path: '/live', maxPayload: 16 * 1024 });
const clean = (s, max) => String(s == null ? '' : s).slice(0, max);

function send(ws, obj) { if (ws.readyState === 1) { try { ws.send(JSON.stringify(obj)); } catch (e) {} } }
function roomOf(ws) { return rooms.get(ws.sala); }
function broadcast(ws, obj, incluirEu) {
  const r = roomOf(ws); if (!r) return;
  const msg = JSON.stringify(obj);
  r.forEach(c => { if ((incluirEu || c !== ws) && c.readyState === 1) { try { c.send(msg); } catch (e) {} } });
}
function leave(ws) {
  const r = roomOf(ws); if (!r) return;
  r.delete(ws);
  if (!r.size) rooms.delete(ws.sala); else broadcast(ws, {t: 'saiu', id: ws.id});
}

wss.on('connection', ws => {
  ws.id = crypto.randomBytes(6).toString('hex');
  ws.vivo = true;
  ws.on('pong', () => { ws.vivo = true; });
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    if (m.t === 'entrar') {
      leave(ws);
      ws.sala = clean(m.sala, 64) || 'reino';
      ws.nome = clean(m.nome, 20) || 'Princesa';
      ws.look = m.look && typeof m.look === 'object' ? m.look : null;
      ws.area = clean(m.area, 24); ws.x = +m.x || 0; ws.z = +m.z || 0; ws.yaw = +m.yaw || 0;
      if (!rooms.has(ws.sala)) rooms.set(ws.sala, new Set());
      const r = rooms.get(ws.sala);
      if (r.size >= 8) return send(ws, {t: 'cheio'});
      r.add(ws);
      // conta quem já está lá e avisa os outros
      send(ws, {t: 'oi', id: ws.id, pares: [...r].filter(c => c !== ws && c.nome).map(c => ({id: c.id, nome: c.nome, look: c.look, area: c.area, x: c.x, z: c.z, yaw: c.yaw}))});
      broadcast(ws, {t: 'entrou', id: ws.id, nome: ws.nome, look: ws.look, area: ws.area, x: ws.x, z: ws.z, yaw: ws.yaw});
      return;
    }
    if (!ws.sala) return;
    if (m.t === 'pos') {
      ws.area = clean(m.area, 24); ws.x = +m.x || 0; ws.z = +m.z || 0; ws.yaw = +m.yaw || 0;
      return broadcast(ws, {t: 'pos', id: ws.id, area: ws.area, x: ws.x, z: ws.z, yaw: ws.yaw, mov: !!m.mov, ar: !!m.ar, pet: clean(m.pet, 30)});
    }
    if (m.t === 'look') { ws.look = m.look && typeof m.look === 'object' ? m.look : ws.look; return broadcast(ws, {t: 'look', id: ws.id, look: ws.look}); }
    if (m.t === 'presente') {
      const r = roomOf(ws);
      const alvo = r && [...r].find(c => c.id === m.para);
      if (!alvo) return send(ws, {t: 'falhou', motivo: 'A princesa saiu do jogo'});
      send(alvo, {t: 'presente', de: ws.nome, deId: ws.id, tipo: clean(m.tipo, 10), id: clean(m.id, 40), n: Math.max(0, Math.min(999, +m.n || 0)), texto: clean(m.texto, 120)});
      return send(ws, {t: 'entregue', para: m.para});
    }
    if (m.t === 'gesto') return broadcast(ws, {t: 'gesto', id: ws.id, g: clean(m.g, 12)});
  });
  ws.on('close', () => leave(ws));
  ws.on('error', () => leave(ws));
});
// derruba conexões mortas
setInterval(() => wss.clients.forEach(ws => { if (!ws.vivo) { leave(ws); return ws.terminate(); } ws.vivo = false; try { ws.ping(); } catch (e) {} }), 30000);

server.on('clientError', (err, sock) => { try { sock.destroy(); } catch (e) {} });
server.listen(PORT, () => console.log('Mundo da Luize rodando na porta ' + PORT + ' (com encontro ao vivo em /live)'));
