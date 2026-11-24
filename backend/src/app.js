const express = require('express');
const cors = require('cors');
const { requireAuth, HttpError } = require('./auth');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '200kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'synchro-api' }));
  app.use('/api/auth', require('./routes/auth'));

  // tudo abaixo exige login
  app.use('/api', requireAuth);
  app.use('/api/spaces', require('./routes/spaces'));
  const { events, memories, discoveries } = require('./routes/items');
  app.use('/api', events, memories, discoveries, require('./routes/universe'));

  app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  });
  return app;
}
module.exports = { createApp };
