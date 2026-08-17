import prismaClient from "../../prisma";
import { PlayerType } from "../../generated/prisma/enums";
import { ensureFeeSettings, isChargeableType, presentFee } from "../player/playerFees";

interface UpdateFeeSettingRequest {
  type: string;
  amount: number;
}

class UpdateFeeSettingService {
  async execute({ type, amount }: UpdateFeeSettingRequest) {
    if (!isChargeableType(type as PlayerType)) {
      throw new Error("Taxa neutra não tem cobrança e não pode ser alterada");
    }

    if (!amount || amount <= 0) {
      throw new Error("Valor da taxa inválido");
    }

    await ensureFeeSettings();

    const feeUpdated = await prismaClient.feeSetting.update({
      where: { type },
      data: { amount },
    });

    return presentFee(feeUpdated);
  }
}

export { UpdateFeeSettingService };
