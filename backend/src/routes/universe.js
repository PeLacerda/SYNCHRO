const { Router } = require('express');
const db = require('../db');
const { memberRole } = require('../auth');

/**
 * UNIVERSO: cada memória, evento realizado e descoberta concluída vira uma estrela.
 * A posição é DETERMINÍSTICA (hash do tipo+id), nunca aleatória: o mesmo registro
 * aparece sempre no mesmo lugar. Cada trimestre ocupa uma célula do céu (3x4) e
 * forma uma constelação, com linhas ligando as estrelas em ordem cronológica.
 */
function hash(str) { // FNV-1a 32 bits -> [0,1)
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h / 4294967296;
}
function position(kind, id, date) {
  const d = new Date(date);
  const q = Math.floor(d.getUTCMonth() / 3);
  const cell = (d.getUTCFullYear() * 4 + q) % 12;
  const col = cell % 3, row = Math.floor(cell / 3);
  return {
    x: Math.round(((col + 0.12 + 0.76 * hash(`${kind}:${id}:x`)) / 3) * 1e4) / 1e4,
    y: Math.round(((row + 0.12 + 0.76 * hash(`${kind}:${id}:y`)) / 4) * 1e4) / 1e4,
  };
}

const r = Router();
r.get('/spaces/:spaceId/universe', (req, res) => {
  const sp = Number(req.params.spaceId);
  memberRole(sp, req.user.id);
  const stars = [
    ...db.prepare('SELECT id, title, happened_at AS date FROM memories WHERE space_id = ?').all(sp).map((s) => ({ ...s, kind: 'memory' })),
    ...db.prepare('SELECT id, title, starts_at AS date FROM events WHERE space_id = ? AND done = 1').all(sp).map((s) => ({ ...s, kind: 'event' })),
    ...db.prepare('SELECT id, title, completed_at AS date FROM discoveries WHERE space_id = ? AND done = 1 AND completed_at IS NOT NULL').all(sp).map((s) => ({ ...s, kind: 'discovery' })),
  ].map((s) => ({ ...s, ...position(s.kind, s.id, s.date), constellation: `${new Date(s.date).getUTCFullYear()}-T${Math.floor(new Date(s.date).getUTCMonth() / 3) + 1}` }))
    .sort((a, b) => new Date(a.date) - new Date(b.date) || a.kind.localeCompare(b.kind) || a.id - b.id);

  const groups = {};
  for (const s of stars) (groups[s.constellation] ||= []).push(s);
  const constellations = Object.entries(groups).map(([name, list]) => ({
    name, count: list.length, edges: list.slice(1).map((s, i) => [`${list[i].kind}-${list[i].id}`, `${s.kind}-${s.id}`]),
  }));
  const count = (sql) => db.prepare(sql).get(sp).n;
  res.json({
    stars: stars.map((s) => ({ key: `${s.kind}-${s.id}`, ...s })),
    constellations,
    stats: {
      memories: count('SELECT COUNT(*) n FROM memories WHERE space_id = ?'),
      eventsDone: count('SELECT COUNT(*) n FROM events WHERE space_id = ? AND done = 1'),
      eventsTotal: count('SELECT COUNT(*) n FROM events WHERE space_id = ?'),
      discoveriesDone: count('SELECT COUNT(*) n FROM discoveries WHERE space_id = ? AND done = 1'),
      stars: stars.length,
    },
  });
});

module.exports = r;
