import { z } from "zod";
import { yearMonthSchema, optionalYearMonthSchema } from "./common";

export const monthlyReportQuerySchema = yearMonthSchema;

export const publicMonthlyReportQuerySchema = monthlyReportQuerySchema.extend({
  token: z.string().min(8, "Link inválido"),
});

export const balanceDashboardQuerySchema = optionalYearMonthSchema;
