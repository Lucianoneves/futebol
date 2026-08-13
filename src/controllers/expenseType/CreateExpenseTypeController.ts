import { Request, Response } from "express";
import { CreateExpenseTypeService } from "../../services/expenseType/CreateExpenseTypeService";

class CreateExpenseTypeController {
  async handle(request: Request, response: Response) {
    const { name } = request.body;
    const createExpenseTypeService = new CreateExpenseTypeService();
    const type = await createExpenseTypeService.execute({ name });
    return response.json(type);
  }
}

export { CreateExpenseTypeController };
