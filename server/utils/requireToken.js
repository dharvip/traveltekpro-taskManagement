// Simple token middleware. Set TOKEN in env or allow all if not set.
function requireToken(req, res, next) {
  const expected = process.env.API_TOKEN;
  if (!expected) return next();

  const header = req.headers['authorization'] || '';
  // Support 'Bearer <token>' or raw token
  const provided = header.startsWith('Bearer ') ? header.slice(7) : header;
  if (provided && provided === expected) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { requireToken };


