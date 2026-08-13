import { Request, Response } from "express";
import { DetailExpenseService } from "../../services/expense/DetailExpenseService";

class DetailExpenseController {
  async handle(request: Request, response: Response) {
    const expense_id = String(request.params.id);

    const detailExpenseService = new DetailExpenseService();

    const expense = await detailExpenseService.execute({ expense_id });

    return response.json(expense);
  }
}

export { DetailExpenseController };
