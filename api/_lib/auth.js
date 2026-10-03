import { SignJWT, jwtVerify } from 'jose';
import { sendError } from './http.js';

export const COOKIE_NAME = 'drini_session';
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error('SESSION_SECRET is missing or too short');
  return new TextEncoder().encode(secret);
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

// Secure still works under `vercel dev`: browsers treat http://localhost as a secure context.
function cookieAttrs(maxAge) {
  return `Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export async function createSessionCookie() {
  const token = await new SignJWT({ role: 'staff' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
  return `${COOKIE_NAME}=${token}; ${cookieAttrs(MAX_AGE_SECONDS)}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; ${cookieAttrs(0)}`;
}

export async function isLoggedIn(req) {
  const token = readCookie(req, COOKIE_NAME);
  if (!token) return false;
  try {
    await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

// Sends 401 and returns false when the request has no valid session.
export async function requireAuth(req, res) {
  if (await isLoggedIn(req)) return true;
  sendError(res, 401, 'Duhet te identifikohesh.');
  return false;
}
