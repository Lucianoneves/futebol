import { z } from "zod";
import { playerTypeSchema } from "./common";

export const updateFeeSettingSchema = z.object({
  type: playerTypeSchema,
  amount: z.coerce.number().positive("Valor da taxa inválido"),
});
