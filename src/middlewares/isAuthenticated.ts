import type { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";

interface Payload {
  sub: string;
  role: "ADMIN" | "USER";
}

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não informado" });
  }

  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ error: "Token inválido" });
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET não configurado");
    }

    const { sub, role } = verify(token, secret) as Payload;

    if (!sub || !role) {
      return res.status(401).json({ error: "Token inválido" });
    }

    req.user = {
      user_id: sub,
      role,
    };

    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
