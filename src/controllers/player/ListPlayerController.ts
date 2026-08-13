import { Request, Response } from "express";
import { ListPlayerService } from "../../services/player/ListPlayerService";

class ListPlayerController {
  async handle(request: Request, response: Response) {
    const activeQuery = request.query.active as string | undefined;

    const active =
      activeQuery === undefined ? undefined : activeQuery === "true";

    const listPlayerService = new ListPlayerService();

    const players = await listPlayerService.execute({ active });

    return response.json(players);
  }
}

export { ListPlayerController };
