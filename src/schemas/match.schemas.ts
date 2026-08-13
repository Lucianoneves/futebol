import { z } from "zod";
import { ISO_DAY } from "../utils/date";
import { idParamsSchema } from "./common";

const playedOn = z
  .string()
  .regex(ISO_DAY, "Data inválida. Use AAAA-MM-DD");

export const upsertMatchSchema = z.object({
  playedOn,
  player_ids: z
    .array(z.string().uuid("ID do jogador inválido"))
    .min(1, "Selecione quem jogou"),
  notes: z.string().optional(),
});

export const listMatchQuerySchema = z.object({
  playedOn: playedOn.optional(),
});

export const matchIdParamsSchema = idParamsSchema("ID da pelada inválido");

export const matchShareIdParamsSchema = idParamsSchema(
  "ID do rateio inválido"
);
