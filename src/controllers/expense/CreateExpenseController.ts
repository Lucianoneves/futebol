import { Request, Response } from "express";
import { CreateExpenseService } from "../../services/expense/CreateExpenseService";

class CreateExpenseController {
  async handle(request: Request, response: Response) {
    const { expense_type_id, amount, spentAt, from_monthly_cash } = request.body;

    const createExpenseService = new CreateExpenseService();

    const expense = await createExpenseService.execute({
      expense_type_id,
      amount: Number(amount),
      spentAt,
      from_monthly_cash,
    });

    return response.json(expense);
  }
}

export { CreateExpenseController };
