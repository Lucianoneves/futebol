import type { Request, Response, NextFunction } from "express";

export function isStaff(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  if (req.user.role === "PLAYER") {
    return res.status(403).json({
      error: "Acesso permitido apenas para a gestão do time",
    });
  }

  return next();
}
