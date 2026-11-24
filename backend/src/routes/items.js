// CRUD genérico para eventos, memórias e descobertas (todos pertencem a um espaço).
const { Router } = require('express');
const db = require('../db');
const { fail, memberRole } = require('../auth');

const asDate = (v, label) => {
  const d = new Date(v);
  if (!v || Number.isNaN(d.getTime())) throw fail(400, `${label} inválida.`);
  return d.toISOString();
};
const str = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());
const out = (row) => (row && 'done' in row ? { ...row, done: !!row.done } : row);

/**
 * cfg: { table, dateCol, fields: { campo: 'text'|'date' }, required: [campos], order }
 */
function crud(cfg) {
  const r = Router();
  const cols = Object.keys(cfg.fields);

  const clean = (body, partial) => {
    const data = {};
    for (const c of cols) {
      if (partial && !(c in body)) continue;
      const v = body[c];
      if (cfg.fields[c] === 'date') data[c] = asDate(v, 'Data');
      else data[c] = c === 'category' ? (str(v) || 'Outros') : str(v);
      if (cfg.required.includes(c) && !data[c]) throw fail(400, c === 'title' ? 'Informe o título.' : `Campo obrigatório: ${c}.`);
    }
    return data;
  };

  const load = (req) => {
    const id = Number(req.params.id);
    const row = Number.isInteger(id) && db.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).get(id);
    if (!row) throw fail(404, 'Registro não encontrado.');
    memberRole(row.space_id, req.user.id); // 403 se não participa do espaço
    return row;
  };

  r.get('/spaces/:spaceId/' + cfg.table, (req, res) => {
    const spaceId = Number(req.params.spaceId);
    memberRole(spaceId, req.user.id);
    res.json(db.prepare(`SELECT t.*, u.name AS author FROM ${cfg.table} t LEFT JOIN users u ON u.id = t.created_by
      WHERE t.space_id = ? ORDER BY ${cfg.order}`).all(spaceId).map(out));
  });

  r.post('/spaces/:spaceId/' + cfg.table, (req, res) => {
    const spaceId = Number(req.params.spaceId);
    memberRole(spaceId, req.user.id);
    const d = clean(req.body, false);
    const names = ['space_id', 'created_by', ...cols];
    const info = db.prepare(`INSERT INTO ${cfg.table} (${names.join(',')}) VALUES (${names.map(() => '?').join(',')})`)
      .run(spaceId, req.user.id, ...cols.map((c) => d[c]));
    res.status(201).json(out(db.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).get(info.lastInsertRowid)));
  });

  r.patch('/' + cfg.table + '/:id', (req, res) => {
    const row = load(req);
    const d = clean(req.body, true);
    if ('done' in (cfg.extra || {}) || cfg.hasDone) {
      if ('done' in req.body) {
        d.done = req.body.done ? 1 : 0;
        if (cfg.table === 'discoveries') d.completed_at = d.done ? new Date().toISOString() : null;
      }
    }
    const keys = Object.keys(d);
    if (keys.length) db.prepare(`UPDATE ${cfg.table} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...keys.map((k) => d[k]), row.id);
    res.json(out(db.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).get(row.id)));
  });

  r.delete('/' + cfg.table + '/:id', (req, res) => {
    const row = load(req);
    db.prepare(`DELETE FROM ${cfg.table} WHERE id = ?`).run(row.id);
    res.status(204).end();
  });

  r.load = load;
  return r;
}

const events = crud({ table: 'events', hasDone: true, order: 't.starts_at DESC', required: ['title', 'starts_at'],
  fields: { title: 'text', description: 'text', location: 'text', starts_at: 'date', category: 'text' } });
const memories = crud({ table: 'memories', order: 't.happened_at DESC', required: ['title', 'happened_at'],
  fields: { title: 'text', description: 'text', location: 'text', happened_at: 'date', category: 'text' } });
const discoveries = crud({ table: 'discoveries', hasDone: true, order: 't.done ASC, t.created_at DESC', required: ['title'],
  fields: { title: 'text', description: 'text', category: 'text' } });

// Converte uma descoberta concluída em memória
discoveries.post('/discoveries/:id/to-memory', (req, res) => {
  const d = discoveries.load(req);
  if (!d.done) throw fail(400, 'Conclua a descoberta antes de transformá-la em memória.');
  const info = db.prepare('INSERT INTO memories (space_id, created_by, title, description, happened_at, category) VALUES (?,?,?,?,?,?)')
    .run(d.space_id, req.user.id, d.title, d.description, d.completed_at || new Date().toISOString(), d.category);
  res.status(201).json(db.prepare('SELECT * FROM memories WHERE id = ?').get(info.lastInsertRowid));
});

module.exports = { events, memories, discoveries };
