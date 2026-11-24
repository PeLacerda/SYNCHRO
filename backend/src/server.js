const { createApp } = require('./app');
const PORT = process.env.PORT || 3333;
createApp().listen(PORT, '0.0.0.0', () => console.log(`SYNCHRO API rodando em http://localhost:${PORT}/api (teste: /api/health)`));
