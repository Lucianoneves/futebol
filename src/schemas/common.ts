import { z } from "zod";

export const yearSchema = z.coerce.number().int().min(2000, "Ano inválido");
export const monthSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(12, "Mês deve ser entre 1 e 12");

export const yearMonthSchema = z.object({
  year: yearSchema,
  month: monthSchema,
});

export const optionalYearMonthSchema = z.object({
  year: yearSchema.optional(),
  month: monthSchema.optional(),
});

export const playerTypeSchema = z.enum(["MONTHLY", "CASUAL"], {
  message: "Tipo deve ser MONTHLY ou CASUAL",
});

export function idParamsSchema(message: string) {
  return z.object({
    id: z.string().uuid(message),
  });
}
