import { Request, Response } from "express";
import { ListExpenseService } from "../../services/expense/ListExpenseService";

class ListExpenseController {
  async handle(request: Request, response: Response) {
    const expense_type_id = request.query.expense_type_id as string | undefined;

    const listExpenseService = new ListExpenseService();

    const expenses = await listExpenseService.execute({ expense_type_id });

    return response.json(expenses);
  }
}

export { ListExpenseController };
