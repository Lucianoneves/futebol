import { Request, Response } from "express";
import { MarkPaymentOverdueService } from "../../services/payment/MarkPaymentOverdueService";

class MarkPaymentOverdueController {
  async handle(request: Request, response: Response) {
    const payment_id = String(request.params.id);

    const markPaymentOverdueService = new MarkPaymentOverdueService();

    const payment = await markPaymentOverdueService.execute({ payment_id });

    return response.json(payment);
  }
}

export { MarkPaymentOverdueController };
