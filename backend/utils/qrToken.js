const crypto = require("crypto");

const VALIDITY_MS = 30_000;
const GRACE_MS = 10_000;
const MAX_AGE_MS = VALIDITY_MS + GRACE_MS;
const DOMAIN = "qr:v1";

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
};

const sign = (sessionId, issuedAt = Date.now()) => {
  const payload = `${DOMAIN}:${sessionId}:${issuedAt}`;
  const mac = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url")
    .slice(0, 22);
  const token = Buffer.from(`${sessionId}.${issuedAt}.${mac}`).toString(
    "base64url",
  );
  return { token, issuedAt, expiresAt: issuedAt + VALIDITY_MS };
};

const verify = (token) => {
  let decoded;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    const err = new Error("Malformed QR token.");
    err.status = 400;
    throw err;
  }

  const parts = decoded.split(".");
  if (parts.length !== 3) {
    const err = new Error("Malformed QR token.");
    err.status = 400;
    throw err;
  }

  const [sessionId, issuedAtStr, mac] = parts;
  const issuedAt = Number(issuedAtStr);
  if (!sessionId || !Number.isFinite(issuedAt)) {
    const err = new Error("Malformed QR token.");
    err.status = 400;
    throw err;
  }

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(`${DOMAIN}:${sessionId}:${issuedAt}`)
    .digest("base64url")
    .slice(0, 22);

  const macBuf = Buffer.from(mac);
  const expectedBuf = Buffer.from(expected);
  if (
    macBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(macBuf, expectedBuf)
  ) {
    const err = new Error("Invalid QR token signature.");
    err.status = 403;
    throw err;
  }

  if (Date.now() - issuedAt > MAX_AGE_MS) {
    const err = new Error(
      "QR code has expired. Ask your teacher to refresh the screen.",
    );
    err.status = 403;
    throw err;
  }

  return { sessionId, issuedAt };
};

module.exports = { sign, verify, VALIDITY_MS, GRACE_MS, MAX_AGE_MS };
