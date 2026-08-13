import { ensureFeeSettings, presentFee } from "../player/playerFees";

class ListFeeSettingService {
  async execute() {
    const fees = await ensureFeeSettings();

    return fees.map(presentFee);
  }
}

export { ListFeeSettingService };
