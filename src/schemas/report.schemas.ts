import { z } from "zod";

export const monthlyReportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000, "Ano inválido"),
  month: z.coerce.number().int().min(1).max(12, "Mês deve ser entre 1 e 12"),
});

export const publicMonthlyReportQuerySchema = monthlyReportQuerySchema.extend({
  token: z.string().min(8, "Link inválido"),
});

export const balanceDashboardQuerySchema = z.object({
  year: z.coerce.number().int().min(2000, "Ano inválido").optional(),
  month: z.coerce.number().int().min(1).max(12, "Mês inválido").optional(),
});
