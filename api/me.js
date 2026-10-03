import { isLoggedIn } from './_lib/auth.js';
import { methodNotAllowed, sendJson, withErrors } from './_lib/http.js';

export default withErrors(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  sendJson(res, 200, { loggedIn: await isLoggedIn(req) });
});
