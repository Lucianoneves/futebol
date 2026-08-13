import prismaClient from "../../prisma";
import { ensureFeeSettings } from "../player/playerFees";

class ListFeeSettingService {
  async execute() {
    const fees = await ensureFeeSettings();

    return fees.map((fee) => ({
      id: fee.id,
      type: fee.type,
      amount: Number(fee.amount),
      updatedAt: fee.updatedAt,
    }));
  }
}

export { ListFeeSettingService };
