import prismaClient from "../../prisma";
import { PlayerType } from "../../generated/prisma/enums";

export const DEFAULT_FEES = {
  MONTHLY: 40.0,
  CASUAL: 15.0,
} as const;

export function feeFromPlayer(player: {
  type: PlayerType;
  monthlyFee?: unknown;
  casualFee?: unknown;
}) {
  if (player.type === PlayerType.MONTHLY) {
    return Number(player.monthlyFee) || DEFAULT_FEES.MONTHLY;
  }

  return Number(player.casualFee) || DEFAULT_FEES.CASUAL;
}

export async function ensureFeeSettings() {
  const existing = await prismaClient.feeSetting.findMany();

  if (existing.length === 0) {
    await prismaClient.feeSetting.createMany({
      data: [
        { type: PlayerType.MONTHLY, amount: DEFAULT_FEES.MONTHLY },
        { type: PlayerType.CASUAL, amount: DEFAULT_FEES.CASUAL },
      ],
    });

    return prismaClient.feeSetting.findMany({
      orderBy: { type: "asc" },
    });
  }

  return existing;
}

export async function getFeeAmountByType(type: PlayerType) {
  await ensureFeeSettings();

  const setting = await prismaClient.feeSetting.findUnique({
    where: { type },
  });

  if (!setting) {
    throw new Error(`Taxa não configurada para o tipo ${type}`);
  }

  return Number(setting.amount);
}

export async function resolvePlayerFees(type: PlayerType) {
  const fee = await getFeeAmountByType(type);

  return {
    monthlyFee: type === PlayerType.MONTHLY ? fee : null,
    casualFee: type === PlayerType.CASUAL ? fee : null,
  };
}
