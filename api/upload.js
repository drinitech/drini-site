import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { requireAuth } from './_lib/auth.js';
import { methodNotAllowed, sendError, sendJson, withErrors } from './_lib/http.js';

// Note: Vercel caps function request bodies at ~4.5 MB, so the client compresses first.
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = {
  'image/jpeg': { ext: 'jpg', magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png':  { ext: 'png', magic: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  'image/webp': { ext: 'webp', magic: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
};

// Reads the raw image body (sent as the file itself, Content-Type = image type).
async function readRaw(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default withErrors(async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const contentType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const type = TYPES[contentType];
  if (!type) return sendError(res, 400, 'Lejohen vetem foto JPEG, PNG ose WEBP.');
  if (Number(req.headers['content-length'] || 0) > MAX_BYTES) {
    return sendError(res, 413, 'Foto eshte shume e madhe (maksimumi 5 MB).');
  }

  const buf = await readRaw(req, MAX_BYTES);
  if (!buf) return sendError(res, 413, 'Foto eshte shume e madhe (maksimumi 5 MB).');
  if (buf.length < 12 || !type.magic(buf)) return sendError(res, 400, 'Skedari nuk eshte foto e vlefshme.');

  const blob = await put(`hero/${randomUUID()}.${type.ext}`, buf, {
    access: 'public',
    contentType,
  });
  sendJson(res, 201, { url: blob.url });
});
