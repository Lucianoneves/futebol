import { z } from "zod";

export const createPaymentSchema = z.object({
  player_id: z.string().uuid("ID do jogador inválido"),
  year: z.coerce.number().int().min(2000, "Ano inválido"),
  month: z.coerce.number().int().min(1).max(12, "Mês deve ser entre 1 e 12"),
  amount: z.coerce.number().positive("Valor inválido").optional(),
  paid_amount: z.coerce.number().positive("Valor pago inválido").optional(),
  notes: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  amount: z.coerce.number().positive("Valor inválido").optional(),
  notes: z.string().optional(),
});

export const addPaymentValueSchema = z.object({
  value: z.coerce
    .number()
    .refine((value) => value !== 0, "Informe um valor para somar ou subtrair"),
});

export const generateMonthlyPaymentsSchema = z.object({
  year: z.coerce.number().int().min(2000, "Ano inválido"),
  month: z.coerce.number().int().min(1).max(12, "Mês deve ser entre 1 e 12"),
});

export const paymentIdParamsSchema = z.object({
  id: z.string().uuid("ID do pagamento inválido"),
});
