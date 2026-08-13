import { Request, Response } from "express";
import { ListMatchService } from "../../services/match/ListMatchService";

class ListMatchController {
  async handle(request: Request, response: Response) {
    const playedOn = request.query.playedOn as string | undefined;

    const listMatchService = new ListMatchService();
    const matches = await listMatchService.execute({ playedOn });

    return response.json(matches);
  }
}

export { ListMatchController };
