import { createHmac, timingSafeEqual } from "crypto";

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error("JWT_SECRET não configurado");
  }
  return value;
}

export function reportShareToken(year: number, month: number) {
  return createHmac("sha256", secret())
    .update(`report:${year}:${month}`)
    .digest("base64url")
    .slice(0, 16);
}

export function isValidReportShareToken(
  year: number,
  month: number,
  token: string
) {
  if (!token) return false;

  const expected = reportShareToken(year, month);
  const received = String(token);

  if (received.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}
