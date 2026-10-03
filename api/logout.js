import { clearSessionCookie } from './_lib/auth.js';
import { methodNotAllowed, sendJson, withErrors } from './_lib/http.js';

export default withErrors(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  res.setHeader('Set-Cookie', clearSessionCookie());
  sendJson(res, 200, { loggedIn: false });
});
