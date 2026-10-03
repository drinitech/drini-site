import { createHash, timingSafeEqual } from 'node:crypto';
import { createSessionCookie } from './_lib/auth.js';
import { methodNotAllowed, readJsonBody, sendError, sendJson, withErrors } from './_lib/http.js';

// Best-effort throttle: per warm instance only, but it still slows down guessing.
const failures = new Map(); // ip -> { count, until }
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
}

// Hashing first makes both buffers the same length, as timingSafeEqual requires.
function safeEqual(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default withErrors(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const expected = process.env.APP_PASSWORD;
  if (!expected) throw new Error('APP_PASSWORD is not set');

  const ip = clientIp(req);
  const entry = failures.get(ip);
  if (entry && entry.until > Date.now() && entry.count >= MAX_FAILURES) {
    return sendError(res, 429, 'Shume tentime te gabuara. Provo perseri pas pak minutash.');
  }

  const body = readJsonBody(req, res, 4 * 1024);
  if (!body) return;
  const password = typeof body.password === 'string' ? body.password : '';

  if (!password || !safeEqual(password, expected)) {
    const now = Date.now();
    const next = entry && entry.until > now ? entry : { count: 0, until: now + WINDOW_MS };
    next.count += 1;
    failures.set(ip, next);
    await sleep(1000);
    return sendError(res, 401, 'Fjalekalimi eshte i gabuar.');
  }

  failures.delete(ip);
  res.setHeader('Set-Cookie', await createSessionCookie());
  sendJson(res, 200, { loggedIn: true });
});
