import { Request, Response } from "express";
import { ListExpenseTypeService } from "../../services/expenseType/ListExpenseTypeService";

class ListExpenseTypeController {
  async handle(request: Request, response: Response) {
    const listExpenseTypeService = new ListExpenseTypeService();
    const types = await listExpenseTypeService.execute();
    return response.json(types);
  }
}

export { ListExpenseTypeController };
