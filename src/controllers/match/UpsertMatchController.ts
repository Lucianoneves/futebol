import { Request, Response } from "express";
import { UpsertMatchService } from "../../services/match/UpsertMatchService";

class UpsertMatchController {
  async handle(request: Request, response: Response) {
    const { playedOn, player_ids, notes } = request.body;

    const upsertMatchService = new UpsertMatchService();
    const match = await upsertMatchService.execute({
      playedOn,
      player_ids,
      notes,
    });

    return response.json(match);
  }
}

export { UpsertMatchController };
