import { z } from "zod";
import { idParamsSchema } from "./common";

export const createExpenseSchema = z.object({
  expense_type_id: z.string().uuid("Tipo de despesa inválido"),
  amount: z.coerce.number().positive("Valor da despesa inválido"),
  spentAt: z.string().optional(),
  from_monthly_cash: z.boolean().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseIdParamsSchema = idParamsSchema("ID da despesa inválido");

export const createExpenseTypeSchema = z.object({
  name: z.string().min(1, "Nome do tipo de despesa é obrigatório"),
});
