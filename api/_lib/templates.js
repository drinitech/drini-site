import { MAX_DATA_BYTES, sendError } from './http.js';

// Each validator returns the cleaned value, or null after sending a 400/413.

export function validateName(body, res) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 1 || name.length > 120) {
    sendError(res, 400, 'Emri duhet te kete 1 deri ne 120 karaktere.');
    return null;
  }
  return name;
}

export function validateData(body, res) {
  const data = body.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    sendError(res, 400, 'Te dhenat e shabllonit duhet te jene nje objekt.');
    return null;
  }
  if (Buffer.byteLength(JSON.stringify(data), 'utf8') > MAX_DATA_BYTES) {
    sendError(res, 413, 'Shablloni eshte shume i madh (maksimumi 500 KB).');
    return null;
  }
  return data;
}

// Only real http(s) URLs are usable as list thumbnails.
export function heroUrlFrom(data) {
  const url = data.heroImage;
  return typeof url === 'string' && /^https?:\/\//i.test(url) && url.length <= 2048 ? url : null;
}
