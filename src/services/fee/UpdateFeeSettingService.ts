import prismaClient from "../../prisma";
import { PlayerType } from "../../generated/prisma/enums";
import { ensureFeeSettings } from "../player/playerFees";

interface UpdateFeeSettingRequest {
  type: string;
  amount: number;
}

class UpdateFeeSettingService {
  async execute({ type, amount }: UpdateFeeSettingRequest) {
    if (type !== PlayerType.MONTHLY && type !== PlayerType.CASUAL) {
      throw new Error("Tipo deve ser MONTHLY ou CASUAL");
    }

    if (!amount || amount <= 0) {
      throw new Error("Valor da taxa inválido");
    }

    await ensureFeeSettings();

    const feeUpdated = await prismaClient.feeSetting.update({
      where: { type },
      data: { amount },
    });

    return {
      id: feeUpdated.id,
      type: feeUpdated.type,
      amount: Number(feeUpdated.amount),
      updatedAt: feeUpdated.updatedAt,
    };
  }
}

export { UpdateFeeSettingService };
