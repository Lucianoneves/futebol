import { Request, Response } from "express";
import { DeactivatePlayerService } from "../../services/player/DeactivatePlayerService";

class DeactivatePlayerController {
  async handle(request: Request, response: Response) {
    const player_id = request.params.id;

    const deactivatePlayerService = new DeactivatePlayerService();

    const player = await deactivatePlayerService.execute({ player_id });

    return response.json(player);
  }
}

export { DeactivatePlayerController };
