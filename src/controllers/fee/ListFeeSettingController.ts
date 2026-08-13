import { Request, Response } from "express";
import { ListFeeSettingService } from "../../services/fee/ListFeeSettingService";

class ListFeeSettingController {
  async handle(request: Request, response: Response) {
    const listFeeSettingService = new ListFeeSettingService();
    const fees = await listFeeSettingService.execute();
    return response.json(fees);
  }
}

export { ListFeeSettingController };
