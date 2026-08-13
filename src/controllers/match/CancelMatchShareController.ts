import { Request, Response } from "express";
import { CancelMatchShareService } from "../../services/match/CancelMatchShareService";

class CancelMatchShareController {
  async handle(request: Request, response: Response) {
    const share_id = String(request.params.id);

    const cancelMatchShareService = new CancelMatchShareService();
    const share = await cancelMatchShareService.execute({ share_id });

    return response.json(share);
  }
}

export { CancelMatchShareController };
