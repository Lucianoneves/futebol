import prismaClient from "../../prisma";

interface ListExpenseRequest {
  expense_type_id?: string;
}

class ListExpenseService {
  async execute({ expense_type_id }: ListExpenseRequest) {
    const expenses = await prismaClient.expense.findMany({
      where: {
        ...(expense_type_id && { expenseTypeId: expense_type_id }),
      },
      include: {
        expenseType: true,
        cashFlow: true,
      },
      orderBy: {
        spentAt: "desc",
      },
    });

    return expenses;
  }
}

export { ListExpenseService };
