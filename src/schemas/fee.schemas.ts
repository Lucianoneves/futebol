import { z } from "zod";

export const updateFeeSettingSchema = z.object({
  type: z.enum(["MONTHLY", "CASUAL"], {
    message: "Tipo deve ser MONTHLY ou CASUAL",
  }),
  amount: z.coerce.number().positive("Valor da taxa inválido"),
});
