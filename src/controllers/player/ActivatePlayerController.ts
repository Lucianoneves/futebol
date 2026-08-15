import { Request, Response } from "express";
import { ActivatePlayerService } from "../../services/player/ActivatePlayerService";

class ActivatePlayerController {
  async handle(request: Request, response: Response) {
    const player_id = request.params.id;

    const activatePlayerService = new ActivatePlayerService();
    const player = await activatePlayerService.execute({ player_id });

    return response.json(player);
  }
}

export { ActivatePlayerController };
