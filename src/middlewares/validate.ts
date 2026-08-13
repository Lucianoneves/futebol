import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";

type RequestTarget = "body" | "query" | "params";

export function validate(
  schema: ZodTypeAny,
  target: RequestTarget = "body"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[target]);

    if (!parsed.success) {
      const error = parsed.error.issues
        .map((issue) => issue.message)
        .join("; ");

      return res.status(400).json({ error });
    }

    req[target] = parsed.data;
    return next();
  };
}
