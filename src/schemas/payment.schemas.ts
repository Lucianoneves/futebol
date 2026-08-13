import { z } from "zod";
import { idParamsSchema, yearMonthSchema } from "./common";

export const createPaymentSchema = yearMonthSchema.extend({
  player_id: z.string().uuid("ID do jogador inválido"),
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

export const generateMonthlyPaymentsSchema = yearMonthSchema;

export const paymentIdParamsSchema = idParamsSchema("ID do pagamento inválido");
