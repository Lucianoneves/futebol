import { Request, Response } from "express";
import { DeleteExpenseService } from "../../services/expense/DeleteExpenseService";

class DeleteExpenseController {
  async handle(request: Request, response: Response) {
    const expense_id = String(request.params.id);

    const deleteExpenseService = new DeleteExpenseService();

    const result = await deleteExpenseService.execute({ expense_id });

    return response.json(result);
  }
}

export { DeleteExpenseController };
