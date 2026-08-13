import { Request, Response } from "express";
import { MarkPaymentPaidService } from "../../services/payment/MarkPaymentPaidService";

class MarkPaymentPaidController {
  async handle(request: Request, response: Response) {
    const payment_id = String(request.params.id);

    const markPaymentPaidService = new MarkPaymentPaidService();

    const payment = await markPaymentPaidService.execute({ payment_id });

    return response.json(payment);
  }
}

export { MarkPaymentPaidController };
