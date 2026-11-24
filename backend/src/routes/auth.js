const { Router } = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { fail, signToken, requireAuth } = require('../auth');

const r = Router();
const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e);

r.post('/register', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2) throw fail(400, 'Informe seu nome.');
  if (!emailOk(email)) throw fail(400, 'E-mail inválido.');
  if (password.length < 6) throw fail(400, 'A senha deve ter ao menos 6 caracteres.');
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw fail(409, 'Este e-mail já está cadastrado.');
  const id = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email, bcrypt.hashSync(password, 10)).lastInsertRowid;
  res.status(201).json({ token: signToken(id), user: { id, name, email } });
});

r.post('/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  // mesma mensagem para e-mail inexistente e senha errada
  if (!user || !bcrypt.compareSync(String(req.body.password || ''), user.password_hash)) throw fail(401, 'E-mail ou senha incorretos.');
  res.json({ token: signToken(user.id), user: { id: user.id, name: user.name, email: user.email } });
});

r.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

module.exports = r;
