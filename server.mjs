import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

const PORT = Number(process.env.PORT || 4173);
let SCRAPE_CREATORS_API_KEY = process.env.SCRAPE_CREATORS_API_KEY;

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}
function setupError() {
  return !SCRAPE_CREATORS_API_KEY ? 'Otomatik aktarım için Scrape Creators API anahtarı gerekiyor. README.md dosyasındaki kuruluma bak.' : null;
}
function shortcodeFrom(link) {
  const u = new URL(link);
  if (!['instagram.com', 'www.instagram.com'].includes(u.hostname.toLowerCase())) throw new Error('Instagram Reels bağlantısını kontrol et.');
  const match = u.pathname.match(/\/(?:reel|reels|p)\/([\w-]+)/i);
  if (!match) throw new Error('Bağlantıda Reels gönderisi bulunamadı.');
  return match[1];
}
const server = http.createServer(async (req, res) => {
  const base = `http://${req.headers.host || `localhost:${PORT}`}`;
  const url = new URL(req.url, base);
  try {
    if (req.method === 'GET' && url.pathname === '/') {
      send(res, 200, await readFile(new URL('./index.html', import.meta.url), 'utf8'), 'text/html; charset=utf-8'); return;
    }
    if (req.method === 'GET' && url.pathname === '/api/status') {
      send(res, 200, { configured: Boolean(SCRAPE_CREATORS_API_KEY), connected: Boolean(SCRAPE_CREATORS_API_KEY), setupMessage: setupError() }); return;
    }
    if (req.method === 'POST' && url.pathname === '/api/comments') {
      if (!SCRAPE_CREATORS_API_KEY) { send(res, 503, { error: setupError() }); return; }
      let body = ''; for await (const chunk of req) body += chunk;
      const { link } = JSON.parse(body || '{}');
      shortcodeFrom(link || '');
      const comments = [], seen = new Set();
      let cursor = null, pages = 0;
      do {
        const endpoint = new URL('https://api.scrapecreators.com/v2/instagram/post/comments');
        endpoint.searchParams.set('url', link);
        if (cursor) endpoint.searchParams.set('cursor', cursor);
        let data = null, lastError = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const response = await fetch(endpoint, { headers: { 'x-api-key': SCRAPE_CREATORS_API_KEY }, signal: AbortSignal.timeout(30000) });
            data = await response.json();
            if (!response.ok || data.error) throw new Error(data.message || data.error || `Yorum servisi yanıtı: ${response.status}`);
            break;
          } catch (error) { lastError = error; if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1))); }
        }
        if (!data) throw new Error(`Yorumlar alınırken hata oluştu: ${lastError?.message || 'servise ulaşılamadı'}`);
        for (const item of data.comments || []) {
          const id = String(item.id || `${item.user?.username || item.username}:${item.created_at}:${item.text}`);
          if (!seen.has(id)) { seen.add(id); comments.push({ id, username: item.user?.username || item.username || 'katilimci', text: item.text || '', timestamp: item.created_at || '', like_count: Number(item.comment_like_count) || 0 }); }
        }
        const next = data.cursor || data.next_cursor || null;
        pages++;
        if (!next || next === cursor || !(data.comments || []).length) { cursor = null; break; }
        cursor = next;
      } while (cursor && pages < 250);
      send(res, 200, { media: { permalink: link, comments_count: comments.length }, comments, truncated: Boolean(cursor), pages }); return;
    }
    send(res, 404, { error: 'Bulunamadı.' });
  } catch (error) { send(res, 400, { error: error.message || 'Bir hata oluştu.' }); }
});
async function start() {
  if (!SCRAPE_CREATORS_API_KEY) {
    try {
      const localEnv = await readFile(new URL('./.env', import.meta.url), 'utf8');
      const line = localEnv.split(/\r?\n/).find(row => /^SCRAPE_CREATORS_API_KEY\s*=/.test(row));
      if (line) SCRAPE_CREATORS_API_KEY = line.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '');
    } catch { /* Local .env is optional. */ }
  }
  server.listen(PORT, () => console.log(`İntagram Çekiliş hazır: http://localhost:${PORT}`));
}
start();
