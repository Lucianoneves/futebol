import { ensureExpenseTypes } from "./expenseTypes";

class ListExpenseTypeService {
  async execute() {
    const types = await ensureExpenseTypes();

    return types.map((item) => ({
      id: item.id,
      name: item.name,
      active: item.active,
    }));
  }
}

export { ListExpenseTypeService };
