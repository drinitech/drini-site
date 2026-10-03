import { sql } from '../../_lib/db.js';
import { isUuid, methodNotAllowed, sendError, sendJson, withErrors } from '../../_lib/http.js';

export default withErrors(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const id = req.query.id;
  if (!isUuid(id)) return sendError(res, 404, 'Shablloni nuk u gjet.');

  // left() keeps the copy within the 120-char name limit.
  const [row] = await sql`
    insert into templates (name, data, hero_image_url)
    select left(name, 112) || ' (kopje)', data, hero_image_url
    from templates where id = ${id}
    returning id, name, hero_image_url, created_at, updated_at`;
  if (!row) return sendError(res, 404, 'Shablloni nuk u gjet.');
  sendJson(res, 201, { template: row });
});
