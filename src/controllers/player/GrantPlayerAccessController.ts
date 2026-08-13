import { Request, Response } from "express";
import { GrantPlayerAccessService } from "../../services/player/GrantPlayerAccessService";

class GrantPlayerAccessController {
  async handle(request: Request, response: Response) {
    const player_id = String(request.params.id);
    const { email, password } = request.body;

    const grantPlayerAccessService = new GrantPlayerAccessService();
    const user = await grantPlayerAccessService.execute({
      player_id,
      email,
      password,
    });

    return response.json(user);
  }
}

export { GrantPlayerAccessController };
