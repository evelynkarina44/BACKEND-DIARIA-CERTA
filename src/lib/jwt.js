import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "../errors/AppError.js";

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new AppError("Configuração de autenticação indisponível.", 503, "AUTH_NOT_CONFIGURED");
  }
  return secret;
}

function expirationInSeconds(value = process.env.JWT_EXPIRES_IN ?? "1h") {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new AppError("JWT_EXPIRES_IN inválido.", 500, "INVALID_AUTH_CONFIG");
  const factors = { s: 1, m: 60, h: 3600, d: 86400 };
  return Number(match[1]) * factors[match[2]];
}

function signature(content) {
  return createHmac("sha256", getSecret()).update(content).digest("base64url");
}

export function signToken(payload) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode({ ...payload, iat: now, exp: now + expirationInSeconds() });
  const content = `${header}.${body}`;
  return `${content}.${signature(content)}`;
}

export function verifyToken(token) {
  try {
    const [header, body, providedSignature] = token.split(".");
    if (!header || !body || !providedSignature) throw new Error("Malformed token");
    const content = `${header}.${body}`;
    const expected = Buffer.from(signature(content));
    const provided = Buffer.from(providedSignature);
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) throw new Error("Invalid signature");

    const payload = decode(body);
    if (!Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) throw new Error("Expired token");
    return payload;
  } catch (error) {
    if (error instanceof AppError && error.code === "AUTH_NOT_CONFIGURED") throw error;
    throw new AppError("Token inválido ou expirado.", 401, "INVALID_TOKEN");
  }
}
