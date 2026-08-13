import { Request, Response } from "express";
import { PlayerStatusService } from "../../services/player/PlayerStatusService";

class PlayerStatusController {
  async handle(request: Request, response: Response) {
    const user_id = request.user.user_id;
    const year = request.query.year
      ? Number(request.query.year)
      : undefined;
    const month = request.query.month
      ? Number(request.query.month)
      : undefined;

    const playerStatusService = new PlayerStatusService();
    const status = await playerStatusService.execute({
      user_id,
      year,
      month,
    });

    return response.json(status);
  }
}

export { PlayerStatusController };
