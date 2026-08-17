import prismaClient from "../../prisma";
import { PlayerType } from "../../generated/prisma/enums";

export const DEFAULT_FEES = {
  MONTHLY: 40.0,
  CASUAL: 15.0,
  FEES: 0,
} as const;

const FEE_TYPE_ORDER: PlayerType[] = [
  PlayerType.MONTHLY,
  PlayerType.CASUAL,
  PlayerType.FEES,
];

export function isPlayerType(value: string): value is PlayerType {
  return (
    value === PlayerType.MONTHLY ||
    value === PlayerType.CASUAL ||
    value === PlayerType.FEES
  );
}

export function isChargeableType(type: PlayerType) {
  return type === PlayerType.MONTHLY || type === PlayerType.CASUAL;
}

export function feeFromPlayer(player: {
  type: PlayerType;
  monthlyFee?: unknown;
  casualFee?: unknown;
}) {
  if (player.type === PlayerType.FEES) {
    return 0;
  }

  if (player.type === PlayerType.MONTHLY) {
    return Number(player.monthlyFee) || DEFAULT_FEES.MONTHLY;
  }

  return Number(player.casualFee) || DEFAULT_FEES.CASUAL;
}

export async function ensureFeeSettings() {
  const existing = await prismaClient.feeSetting.findMany();
  const byType = new Set(existing.map((fee) => fee.type));
  const missing = FEE_TYPE_ORDER.filter((type) => !byType.has(type)).map(
    (type) => ({
      type,
      amount: DEFAULT_FEES[type],
    })
  );

  if (missing.length > 0) {
    await prismaClient.feeSetting.createMany({ data: missing });
  }

  const fees = await prismaClient.feeSetting.findMany();
  return sortFeeSettings(fees);
}

function sortFeeSettings<T extends { type: PlayerType }>(fees: T[]) {
  return [...fees].sort(
    (left, right) =>
      FEE_TYPE_ORDER.indexOf(left.type) - FEE_TYPE_ORDER.indexOf(right.type)
  );
}

async function getFeeAmountByType(type: PlayerType) {
  await ensureFeeSettings();

  if (!isChargeableType(type)) {
    return DEFAULT_FEES.FEES;
  }

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

export function presentFee(fee: {
  id: string;
  type: PlayerType;
  amount: unknown;
  updatedAt: Date;
}) {
  return {
    id: fee.id,
    type: fee.type,
    amount: Number(fee.amount),
    updatedAt: fee.updatedAt,
  };
}
