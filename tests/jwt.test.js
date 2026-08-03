import assert from "node:assert/strict";
import test from "node:test";
import { signToken, verifyToken } from "../src/lib/jwt.js";

test("JWT is signed and verified with expiration", () => {
  process.env.JWT_SECRET = "a".repeat(64);
  process.env.JWT_EXPIRES_IN = "1h";
  const token = signToken({ sub: "42", tipo: "CLIENTE" });
  const payload = verifyToken(token);
  assert.equal(payload.sub, "42");
  assert.equal(payload.tipo, "CLIENTE");
  assert.ok(payload.exp > payload.iat);
});

test("tampered JWT is rejected", () => {
  process.env.JWT_SECRET = "b".repeat(64);
  const token = signToken({ sub: "42" });
  assert.throws(() => verifyToken(`${token.slice(0, -1)}x`), { code: "INVALID_TOKEN" });
});
