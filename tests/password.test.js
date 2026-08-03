import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "../src/lib/password.js";

test("passwords use salted scrypt hashes", async () => {
  const first = await hashPassword("senha-segura-123");
  const second = await hashPassword("senha-segura-123");
  assert.match(first, /^scrypt:[a-f0-9]+:[a-f0-9]+$/);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("senha-segura-123", first), true);
  assert.equal(await verifyPassword("senha-incorreta", first), false);
  assert.equal(await verifyPassword("senha-segura-123", "texto-puro"), false);
});
