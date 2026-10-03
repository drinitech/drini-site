// Shared helpers for the Vercel Functions. Files under api/_lib are not routes.

export const MAX_DATA_BYTES = 500 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  sendError(res, 405, 'Metoda nuk lejohet.');
}

export function isUuid(id) {
  return typeof id === 'string' && UUID_RE.test(id);
}

// Returns the parsed JSON body, or null when it is missing/invalid/too large
// (an error response has then already been sent).
export function readJsonBody(req, res, maxBytes = MAX_DATA_BYTES + 16 * 1024) {
  const len = Number(req.headers['content-length'] || 0);
  if (len > maxBytes) {
    sendError(res, 413, 'Te dhenat jane shume te medha.');
    return null;
  }
  let body;
  try {
    body = req.body;
  } catch {
    sendError(res, 400, 'JSON i pavlefshem.');
    return null;
  }
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    sendError(res, 400, 'Kerkesa duhet te jete nje objekt JSON.');
    return null;
  }
  return body;
}

// Wraps a handler so unexpected errors are logged and answered with a generic 500.
export function withErrors(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(`[${req.method} ${req.url}]`, err);
      if (!res.headersSent) sendError(res, 500, 'Ndodhi nje gabim ne server. Provo perseri.');
    }
  };
}
