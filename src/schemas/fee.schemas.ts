import { z } from "zod";
import { chargeablePlayerTypeSchema } from "./common";

export const updateFeeSettingSchema = z.object({
  type: chargeablePlayerTypeSchema,
  amount: z.coerce.number().positive("Valor da taxa inválido"),
});
