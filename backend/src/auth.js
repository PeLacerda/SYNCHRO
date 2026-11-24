const jwt = require('jsonwebtoken');
const db = require('./db');

const SECRET = process.env.JWT_SECRET || 'synchro-dev-secret-troque-em-producao';

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => new HttpError(status, message);

const signToken = (userId) => jwt.sign({ sub: userId }, SECRET, { expiresIn: '7d' });

/** Exige "Authorization: Bearer <token>" e confirma que a conta ainda existe. */
function requireAuth(req, _res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return next(fail(401, 'Faça login para continuar.'));
  try {
    const { sub } = jwt.verify(h.slice(7), SECRET);
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(sub);
    if (!user) return next(fail(401, 'Conta não encontrada.'));
    req.user = user;
    next();
  } catch { next(fail(401, 'Sessão inválida ou expirada.')); }
}

/** Autorização por espaço: devolve o papel ou lança 403. */
function memberRole(spaceId, userId) {
  const m = db.prepare('SELECT role FROM space_members WHERE space_id = ? AND user_id = ?').get(spaceId, userId);
  if (!m) throw fail(403, 'Você não participa deste espaço.');
  return m.role;
}

module.exports = { HttpError, fail, signToken, requireAuth, memberRole };
