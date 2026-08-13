import { Request, Response } from "express";
import { CreatePlayerService } from "../../services/player/CreatePlayerService";

class CreatePlayerController {
  async handle(request: Request, response: Response) {
    const { name, type, email, phone } = request.body;

    const createPlayerService = new CreatePlayerService();

    const player = await createPlayerService.execute({
      name,
      type,
      email,
      phone,
    });

    return response.json(player);
  }
}

export { CreatePlayerController };
