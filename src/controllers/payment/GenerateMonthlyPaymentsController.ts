import { Request, Response } from "express";
import { GenerateMonthlyPaymentsService } from "../../services/payment/GenerateMonthlyPaymentsService";

class GenerateMonthlyPaymentsController {
  async handle(request: Request, response: Response) {
    const { year, month } = request.body;

    const generateMonthlyPaymentsService = new GenerateMonthlyPaymentsService();

    const result = await generateMonthlyPaymentsService.execute({
      year: Number(year),
      month: Number(month),
    });

    return response.json(result);
  }
}

export { GenerateMonthlyPaymentsController };
