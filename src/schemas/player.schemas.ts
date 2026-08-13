import { z } from "zod";
import {
  idParamsSchema,
  playerTypeSchema,
  yearMonthSchema,
  yearSchema,
} from "./common";

export const createPlayerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: playerTypeSchema,
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
});

export const updatePlayerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  type: playerTypeSchema.optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  monthlyFee: z.coerce.number().positive("monthlyFee inválido").optional(),
  casualFee: z.coerce.number().positive("casualFee inválido").optional(),
});

export const playerIdParamsSchema = idParamsSchema("ID do jogador inválido");

export const grantPlayerAccessSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const playerHistoryQuerySchema = z.object({
  year: yearSchema.optional(),
});

export const importWhatsAppListSchema = yearMonthSchema.extend({
  text: z.string().min(1, "Cole a lista do WhatsApp"),
  apply: z.coerce.boolean().optional(),
});
