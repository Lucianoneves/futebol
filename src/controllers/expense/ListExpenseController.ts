import { Request, Response } from "express";
import { ListExpenseService } from "../../services/expense/ListExpenseService";

class ListExpenseController {
  async handle(request: Request, response: Response) {
    const expense_type_id = request.query.expense_type_id as string | undefined;
    const spentAt = request.query.spentAt as string | undefined;
    const year = request.query.year
      ? Number(request.query.year)
      : undefined;
    const month = request.query.month
      ? Number(request.query.month)
      : undefined;

    const listExpenseService = new ListExpenseService();

    const expenses = await listExpenseService.execute({
      expense_type_id,
      spentAt,
      year,
      month,
    });

    return response.json(expenses);
  }
}

export { ListExpenseController };
