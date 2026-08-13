import { Request, Response } from "express";
import { CreatePaymentService } from "../../services/payment/CreatePaymentService";

class CreatePaymentController {
  async handle(request: Request, response: Response) {
    const { player_id, year, month, amount, paid_amount, notes } = request.body;

    const createPaymentService = new CreatePaymentService();

    const payment = await createPaymentService.execute({
      player_id,
      year: Number(year),
      month: Number(month),
      amount: amount !== undefined ? Number(amount) : undefined,
      paid_amount: paid_amount !== undefined ? Number(paid_amount) : undefined,
      notes,
    });

    return response.json(payment);
  }
}

export { CreatePaymentController };
