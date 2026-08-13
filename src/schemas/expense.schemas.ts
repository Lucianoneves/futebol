import { z } from "zod";

export const createExpenseSchema = z.object({
  expense_type_id: z.string().uuid("Tipo de despesa inválido"),
  amount: z.coerce.number().positive("Valor da despesa inválido"),
  spentAt: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  expense_type_id: z.string().uuid("Tipo de despesa inválido").optional(),
  amount: z.coerce.number().positive("Valor da despesa inválido").optional(),
  spentAt: z.string().optional(),
});

export const expenseIdParamsSchema = z.object({
  id: z.string().uuid("ID da despesa inválido"),
});

export const createExpenseTypeSchema = z.object({
  name: z.string().min(1, "Nome do tipo de despesa é obrigatório"),
});
