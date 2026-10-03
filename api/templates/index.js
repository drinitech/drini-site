import { requireAuth } from '../_lib/auth.js';
import { sql } from '../_lib/db.js';
import { methodNotAllowed, readJsonBody, sendJson, withErrors } from '../_lib/http.js';
import { heroUrlFrom, validateData, validateName } from '../_lib/templates.js';

export default withErrors(async (req, res) => {
  if (!(await requireAuth(req, res))) return;

  if (req.method === 'GET') {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 120) : '';
    // Escape LIKE wildcards so the search is a plain substring match.
    const pattern = '%' + q.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
    const rows = q
      ? await sql`
          select id, name, hero_image_url, updated_at from templates
          where name ilike ${pattern}
          order by updated_at desc limit 500`
      : await sql`
          select id, name, hero_image_url, updated_at from templates
          order by updated_at desc limit 500`;
    return sendJson(res, 200, { templates: rows });
  }

  if (req.method === 'POST') {
    const body = readJsonBody(req, res);
    if (!body) return;
    const name = validateName(body, res);
    if (name === null) return;
    const data = validateData(body, res);
    if (data === null) return;

    const [row] = await sql`
      insert into templates (name, data, hero_image_url)
      values (${name}, ${JSON.stringify(data)}::jsonb, ${heroUrlFrom(data)})
      returning id, name, data, hero_image_url, created_at, updated_at`;
    return sendJson(res, 201, { template: row });
  }

  methodNotAllowed(res, ['GET', 'POST']);
});
