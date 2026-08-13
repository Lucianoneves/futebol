import { Request, Response } from "express";
import { CancelPaymentService } from "../../services/payment/CancelPaymentService";

class CancelPaymentController {
  async handle(request: Request, response: Response) {
    const payment_id = String(request.params.id);

    const cancelPaymentService = new CancelPaymentService();

    const payment = await cancelPaymentService.execute({ payment_id });

    return response.json(payment);
  }
}

export { CancelPaymentController };
