import { Request, Response } from "express";
import { UpdatePaymentService } from "../../services/payment/UpdatePaymentService";

class UpdatePaymentController {
  async handle(request: Request, response: Response) {
    const payment_id = String(request.params.id);
    const { amount, notes } = request.body;

    const updatePaymentService = new UpdatePaymentService();

    const payment = await updatePaymentService.execute({
      payment_id,
      amount: amount !== undefined ? Number(amount) : undefined,
      notes,
    });

    return response.json(payment);
  }
}

export { UpdatePaymentController };
