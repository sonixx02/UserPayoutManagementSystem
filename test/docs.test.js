const test = require('node:test');
const assert = require('node:assert/strict');
const { openDb } = require('../src/db/db');
const { createApp } = require('../src/app');

test('openapi.json and /docs return 200 OK', async () => {
  const db = openDb(':memory:');
  const app = createApp(db);
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const resOpenApi = await fetch(`http://localhost:${port}/openapi.json`);
    assert.equal(resOpenApi.status, 200);
    const json = await resOpenApi.json();
    assert.equal(json.openapi, '3.0.3');

    const resDocs = await fetch(`http://localhost:${port}/docs`);
    assert.equal(resDocs.status, 200);
    const html = await resDocs.text();
    assert.match(html, /Swagger UI/);
  } finally {
    server.close();
    db.close();
  }
});
