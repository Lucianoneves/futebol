import { Request, Response } from "express";
import { ListPaymentService } from "../../services/payment/ListPaymentService";

class ListPaymentController {
  async handle(request: Request, response: Response) {
    const player_id = request.query.player_id as string | undefined;
    const year = request.query.year
      ? Number(request.query.year)
      : undefined;
    const month = request.query.month
      ? Number(request.query.month)
      : undefined;
    const status = request.query.status as string | undefined;

    const listPaymentService = new ListPaymentService();

    const payments = await listPaymentService.execute({
      player_id,
      year,
      month,
      status,
    });

    return response.json(payments);
  }
}

export { ListPaymentController };
