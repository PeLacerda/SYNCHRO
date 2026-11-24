const { Router } = require('express');
const crypto = require('node:crypto');
const db = require('../db');
const { fail, memberRole } = require('../auth');

const r = Router();
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 6 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');
const sid = (req) => { const n = Number(req.params.id); if (!Number.isInteger(n)) throw fail(400, 'Identificador inválido.'); return n; };

// Lista os espaços do usuário
r.get('/', (req, res) => {
  res.json(db.prepare(`
    SELECT s.id, s.name, s.description, s.invite_code, s.created_at, m.role,
           (SELECT COUNT(*) FROM space_members WHERE space_id = s.id) AS member_count
    FROM spaces s JOIN space_members m ON m.space_id = s.id
    WHERE m.user_id = ? ORDER BY s.created_at`).all(req.user.id));
});

// Cria espaço; o criador vira ADMIN
r.post('/', (req, res) => {
  const name = String(req.body.name || '').trim();
  if (name.length < 2) throw fail(400, 'Dê um nome ao espaço.');
  const create = db.transaction(() => {
    let code = newCode();
    while (db.prepare('SELECT 1 FROM spaces WHERE invite_code = ?').get(code)) code = newCode();
    const id = db.prepare('INSERT INTO spaces (name, description, invite_code, created_by) VALUES (?, ?, ?, ?)')
      .run(name, String(req.body.description || '').trim() || null, code, req.user.id).lastInsertRowid;
    db.prepare("INSERT INTO space_members (space_id, user_id, role) VALUES (?, ?, 'ADMIN')").run(id, req.user.id);
    return id;
  });
  const id = create();
  res.status(201).json(db.prepare('SELECT * FROM spaces WHERE id = ?').get(id));
});

// Entra em um espaço pelo código de convite
r.post('/join', (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const space = db.prepare('SELECT * FROM spaces WHERE invite_code = ?').get(code);
  if (!space) throw fail(404, 'Código de convite inválido.');
  if (db.prepare('SELECT 1 FROM space_members WHERE space_id = ? AND user_id = ?').get(space.id, req.user.id)) throw fail(409, 'Você já participa deste espaço.');
  db.prepare("INSERT INTO space_members (space_id, user_id, role) VALUES (?, ?, 'MEMBER')").run(space.id, req.user.id);
  res.json(space);
});

// Detalhes + participantes (só para membros)
r.get('/:id', (req, res) => {
  const id = sid(req); const role = memberRole(id, req.user.id);
  const space = db.prepare('SELECT * FROM spaces WHERE id = ?').get(id);
  const members = db.prepare(`SELECT u.id, u.name, m.role FROM space_members m JOIN users u ON u.id = m.user_id
    WHERE m.space_id = ? ORDER BY m.joined_at`).all(id);
  // o código de convite só é mostrado ao administrador
  res.json({ ...space, invite_code: role === 'ADMIN' ? space.invite_code : undefined, role, members });
});

// Excluir espaço: só ADMIN
r.delete('/:id', (req, res) => {
  const id = sid(req);
  if (memberRole(id, req.user.id) !== 'ADMIN') throw fail(403, 'Apenas administradores podem excluir o espaço.');
  db.prepare('DELETE FROM spaces WHERE id = ?').run(id);
  res.status(204).end();
});

// Remover participante (ADMIN) ou sair do espaço (o próprio usuário)
r.delete('/:id/members/:userId', (req, res) => {
  const id = sid(req); const target = Number(req.params.userId);
  const role = memberRole(id, req.user.id);
  if (target !== req.user.id && role !== 'ADMIN') throw fail(403, 'Apenas administradores podem remover participantes.');
  const space = db.prepare('SELECT created_by FROM spaces WHERE id = ?').get(id);
  if (target === space.created_by && target !== req.user.id) throw fail(403, 'O criador do espaço não pode ser removido.');
  if (target === space.created_by) throw fail(400, 'O criador não pode sair; exclua o espaço se quiser encerrá-lo.');
  db.prepare('DELETE FROM space_members WHERE space_id = ? AND user_id = ?').run(id, target);
  res.status(204).end();
});

module.exports = r;
