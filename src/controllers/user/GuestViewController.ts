import { Request, Response } from "express";
import { GuestViewService } from "../../services/user/GuestViewService";

class GuestViewController {
  async handle(_request: Request, response: Response) {
    const guestViewService = new GuestViewService();
    const session = await guestViewService.execute();
    return response.json(session);
  }
}

export { GuestViewController };
