import { Request, Response } from "express";
import { MarkMatchSharePaidService } from "../../services/match/MarkMatchSharePaidService";

class MarkMatchSharePaidController {
  async handle(request: Request, response: Response) {
    const share_id = String(request.params.id);

    const markMatchSharePaidService = new MarkMatchSharePaidService();
    const share = await markMatchSharePaidService.execute({ share_id });

    return response.json(share);
  }
}

export { MarkMatchSharePaidController };
