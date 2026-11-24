process.env.DB_FILE = ':memory:';
const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

let server, base;
test.before(async () => { server = createApp().listen(0); base = `http://127.0.0.1:${server.address().port}/api`; });
test.after(() => server.close());

const call = async (method, path, body, token) => {
  const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, data: res.status === 204 ? null : await res.json() };
};

test('fluxo completo + permissões', async () => {
  const a = (await call('POST', '/auth/register', { name: 'Ana', email: 'ana@x.com', password: '123456' })).data;
  const b = (await call('POST', '/auth/register', { name: 'Beto', email: 'beto@x.com', password: '123456' })).data;
  const c = (await call('POST', '/auth/register', { name: 'Caio', email: 'caio@x.com', password: '123456' })).data;
  assert.equal((await call('POST', '/auth/register', { name: 'Ana', email: 'ana@x.com', password: '123456' })).status, 409);
  assert.equal((await call('POST', '/auth/login', { email: 'ana@x.com', password: 'errada' })).status, 401);
  assert.equal((await call('GET', '/spaces')).status, 401);

  const space = (await call('POST', '/spaces', { name: 'Nós' }, a.token)).data;
  assert.equal((await call('POST', '/spaces/join', { code: space.invite_code }, b.token)).status, 200);

  // não-membro: 403
  assert.equal((await call('GET', `/spaces/${space.id}/events`, null, c.token)).status, 403);
  assert.equal((await call('GET', `/spaces/${space.id}`, null, c.token)).status, 403);

  const ev = (await call('POST', `/spaces/${space.id}/events`, { title: 'Jantar', starts_at: '2026-03-10T20:00:00Z' }, b.token)).data;
  assert.equal((await call('PATCH', `/events/${ev.id}`, { done: true }, c.token)).status, 403);
  assert.equal((await call('PATCH', `/events/${ev.id}`, { done: true }, a.token)).data.done, true);
  assert.equal((await call('POST', `/spaces/${space.id}/events`, { title: '' }, a.token)).status, 400);

  await call('POST', `/spaces/${space.id}/memories`, { title: 'Praia', happened_at: '2026-01-05' }, a.token);
  const d = (await call('POST', `/spaces/${space.id}/discoveries`, { title: 'Trilha' }, a.token)).data;
  assert.equal((await call('POST', `/discoveries/${d.id}/to-memory`, null, a.token)).status, 400);
  await call('PATCH', `/discoveries/${d.id}`, { done: true }, a.token);
  assert.equal((await call('POST', `/discoveries/${d.id}/to-memory`, null, a.token)).status, 201);

  const u1 = (await call('GET', `/spaces/${space.id}/universe`, null, a.token)).data;
  const u2 = (await call('GET', `/spaces/${space.id}/universe`, null, b.token)).data;
  assert.equal(u1.stats.stars, 4); // 2 memórias + evento feito + descoberta feita
  assert.deepEqual(u1.stars, u2.stars); // determinístico
  assert.equal((await call('GET', `/spaces/${space.id}/universe`, null, c.token)).status, 403);

  // só ADMIN exclui / remove
  assert.equal((await call('DELETE', `/spaces/${space.id}`, null, b.token)).status, 403);
  assert.equal((await call('DELETE', `/spaces/${space.id}/members/${a.user.id}`, null, b.token)).status, 403);
  assert.equal((await call('DELETE', `/spaces/${space.id}/members/${b.user.id}`, null, a.token)).status, 204);
  assert.equal((await call('DELETE', `/spaces/${space.id}`, null, a.token)).status, 204);
});
