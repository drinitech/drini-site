import { sql } from '../../_lib/db.js';
import { isUuid, methodNotAllowed, readJsonBody, sendError, sendJson, withErrors } from '../../_lib/http.js';
import { heroUrlFrom, validateData, validateName } from '../../_lib/templates.js';

const NOT_FOUND = 'Shablloni nuk u gjet.';

export default withErrors(async (req, res) => {
  const id = req.query.id;
  if (!isUuid(id)) return sendError(res, 404, NOT_FOUND);

  if (req.method === 'GET') {
    const [row] = await sql`
      select id, name, data, hero_image_url, created_at, updated_at
      from templates where id = ${id}`;
    if (!row) return sendError(res, 404, NOT_FOUND);
    return sendJson(res, 200, { template: row });
  }

  // {name, data} replaces both; {name} alone is a rename.
  if (req.method === 'PUT') {
    const body = readJsonBody(req, res);
    if (!body) return;
    const name = validateName(body, res);
    if (name === null) return;

    let row;
    if (body.data === undefined) {
      [row] = await sql`
        update templates set name = ${name}, updated_at = now()
        where id = ${id}
        returning id, name, hero_image_url, created_at, updated_at`;
    } else {
      const data = validateData(body, res);
      if (data === null) return;
      [row] = await sql`
        update templates
        set name = ${name}, data = ${JSON.stringify(data)}::jsonb,
            hero_image_url = ${heroUrlFrom(data)}, updated_at = now()
        where id = ${id}
        returning id, name, hero_image_url, created_at, updated_at`;
    }
    if (!row) return sendError(res, 404, NOT_FOUND);
    return sendJson(res, 200, { template: row });
  }

  if (req.method === 'DELETE') {
    const [row] = await sql`delete from templates where id = ${id} returning id`;
    if (!row) return sendError(res, 404, NOT_FOUND);
    return sendJson(res, 200, { deleted: true });
  }

  methodNotAllowed(res, ['GET', 'PUT', 'DELETE']);
});
