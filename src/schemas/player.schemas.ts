import { z } from "zod";

export const createPlayerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["MONTHLY", "CASUAL"], {
    message: "Tipo deve ser MONTHLY ou CASUAL",
  }),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
});

export const updatePlayerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  type: z
    .enum(["MONTHLY", "CASUAL"], {
      message: "Tipo deve ser MONTHLY ou CASUAL",
    })
    .optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  monthlyFee: z.coerce.number().positive("monthlyFee inválido").optional(),
  casualFee: z.coerce.number().positive("casualFee inválido").optional(),
});

export const playerIdParamsSchema = z.object({
  id: z.string().uuid("ID do jogador inválido"),
});

export const importWhatsAppListSchema = z.object({
  text: z.string().min(1, "Cole a lista do WhatsApp"),
  year: z.coerce.number().int().min(2000, "Ano inválido"),
  month: z.coerce.number().int().min(1).max(12, "Mês deve ser entre 1 e 12"),
  apply: z.coerce.boolean().optional(),
});
