import { Request, Response } from "express";
import { UpdatePlayerService } from "../../services/player/UpdatePlayerService";

class UpdatePlayerController {
  async handle(request: Request, response: Response) {
    const player_id = request.params.id;
    const { name, email, phone, type, monthlyFee, casualFee } = request.body;

    const updatePlayerService = new UpdatePlayerService();

    const player = await updatePlayerService.execute({
      player_id,
      name,
      email,
      phone,
      type,
      monthlyFee,
      casualFee,
    });

    return response.json(player);
  }
}

export { UpdatePlayerController };
