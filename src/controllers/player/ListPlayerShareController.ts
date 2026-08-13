import { Request, Response } from "express";
import { ListPlayerShareService } from "../../services/player/ListPlayerShareService";

class ListPlayerShareController {
  async handle(request: Request, response: Response) {
    const listPlayerShareService = new ListPlayerShareService();
    const shares = await listPlayerShareService.execute({
      user_id: request.user.user_id,
    });

    return response.json(shares);
  }
}

export { ListPlayerShareController };
