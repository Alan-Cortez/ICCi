export function sendJson(res, status, body) {
  const json = JSON.stringify(body, (key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  );
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(json);
}

export function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== 'string') return null;
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

export function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}
