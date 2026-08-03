import assert from "node:assert/strict";
import test from "node:test";
import app from "../src/app.js";

async function withServer(run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("health endpoint responds without internal details", () => withServer(async (baseUrl) => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { status: "ok" } });
  assert.equal(response.headers.get("x-powered-by"), null);
}));

test("private endpoint requires authentication", () => withServer(async (baseUrl) => {
  const response = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    error: { code: "AUTHENTICATION_REQUIRED", message: "Autenticação necessária." },
  });
}));

test("Zod rejects unknown and invalid registration data", () => withServer(async (baseUrl) => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tipo: "CLIENTE", email: "inválido", admin: true }),
  });
  assert.equal(response.status, 422);
  const body = await response.json();
  assert.equal(body.error.code, "VALIDATION_ERROR");
}));

test("unknown routes use the standard error envelope", () => withServer(async (baseUrl) => {
  const response = await fetch(`${baseUrl}/nao-existe`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, "ROUTE_NOT_FOUND");
}));

test("validated public worker search runs against the database", () => withServer(async (baseUrl) => {
  const response = await fetch(`${baseUrl}/api/diaristas?page=1&limit=10&ordenar_por=recentes`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(Array.isArray(body.data));
  assert.equal(body.pagination.page, 1);
  assert.equal(body.pagination.limit, 10);
}));
