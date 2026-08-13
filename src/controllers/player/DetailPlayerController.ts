import { Request, Response } from "express";
import { DetailPlayerService } from "../../services/player/DetailPlayerService";

class DetailPlayerController {
  async handle(request: Request, response: Response) {
    const player_id = request.params.id;

    const detailPlayerService = new DetailPlayerService();

    const player = await detailPlayerService.execute({ player_id });

    return response.json(player);
  }
}

export { DetailPlayerController };
