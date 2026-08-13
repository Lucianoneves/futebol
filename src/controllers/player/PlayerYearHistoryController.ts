import { Request, Response } from "express";
import { PlayerYearHistoryService } from "../../services/player/PlayerYearHistoryService";

class PlayerYearHistoryController {
  async handle(request: Request, response: Response) {
    const player_id = request.params.id;
    const year = request.query.year
      ? Number(request.query.year)
      : new Date().getFullYear();

    const playerYearHistoryService = new PlayerYearHistoryService();
    const history = await playerYearHistoryService.execute({ player_id, year });

    return response.json(history);
  }
}

export { PlayerYearHistoryController };
