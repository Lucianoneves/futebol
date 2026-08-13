import { Request, Response } from "express";
import { AddPaymentValueService } from "../../services/payment/AddPaymentValueService";

class AddPaymentValueController {
  async handle(request: Request, response: Response) {
    const payment_id = String(request.params.id);
    const { value } = request.body;

    const addPaymentValueService = new AddPaymentValueService();

    const payment = await addPaymentValueService.execute({
      payment_id,
      value: Number(value),
    });

    return response.json(payment);
  }
}

export { AddPaymentValueController };
