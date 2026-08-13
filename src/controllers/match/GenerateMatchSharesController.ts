import { Request, Response } from "express";
import { GenerateMatchSharesService } from "../../services/match/GenerateMatchSharesService";

class GenerateMatchSharesController {
  async handle(request: Request, response: Response) {
    const match_id = String(request.params.id);

    const generateMatchSharesService = new GenerateMatchSharesService();
    const match = await generateMatchSharesService.execute({ match_id });

    return response.json(match);
  }
}

export { GenerateMatchSharesController };
