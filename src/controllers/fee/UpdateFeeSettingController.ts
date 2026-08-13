import { Request, Response } from "express";
import { UpdateFeeSettingService } from "../../services/fee/UpdateFeeSettingService";

class UpdateFeeSettingController {
  async handle(request: Request, response: Response) {
    const { type, amount } = request.body;

    const updateFeeSettingService = new UpdateFeeSettingService();

    const fee = await updateFeeSettingService.execute({
      type,
      amount: Number(amount),
    });

    return response.json(fee);
  }
}

export { UpdateFeeSettingController };
