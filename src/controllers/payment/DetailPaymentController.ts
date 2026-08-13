import { Request, Response } from "express";
import { DetailPaymentService } from "../../services/payment/DetailPaymentService";

class DetailPaymentController {
  async handle(request: Request, response: Response) {
    const payment_id = String(request.params.id);

    const detailPaymentService = new DetailPaymentService();

    const payment = await detailPaymentService.execute({ payment_id });

    return response.json(payment);
  }
}

export { DetailPaymentController };
