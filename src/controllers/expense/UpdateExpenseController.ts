import { Request, Response } from "express";
import { UpdateExpenseService } from "../../services/expense/UpdateExpenseService";

class UpdateExpenseController {
  async handle(request: Request, response: Response) {
    const expense_id = String(request.params.id);
    const { expense_type_id, amount, spentAt } = request.body;

    const updateExpenseService = new UpdateExpenseService();

    const expense = await updateExpenseService.execute({
      expense_id,
      expense_type_id,
      amount: amount !== undefined ? Number(amount) : undefined,
      spentAt,
    });

    return response.json(expense);
  }
}

export { UpdateExpenseController };
