import prismaClient, { expenseInclude } from "../../prisma";
import { monthRange, dayRange } from "../../utils/date";

interface ListExpenseRequest {
  expense_type_id?: string;
  spentAt?: string;
  year?: number;
  month?: number;
}

class ListExpenseService {
  async execute({ expense_type_id, spentAt, year, month }: ListExpenseRequest) {
    const range = spentAt
      ? dayRange(spentAt)
      : year && month
        ? monthRange(year, month)
        : null;

    const expenses = await prismaClient.expense.findMany({
      where: {
        ...(expense_type_id && { expenseTypeId: expense_type_id }),
        ...(range && { spentAt: { gte: range.start, lt: range.end } }),
      },
      include: expenseInclude,
      orderBy: {
        spentAt: "desc",
      },
    });

    return expenses;
  }
}

export { ListExpenseService };
