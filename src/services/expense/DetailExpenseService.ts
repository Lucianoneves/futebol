import prismaClient, { expenseInclude } from "../../prisma";

interface DetailExpenseRequest {
  expense_id: string;
}

class DetailExpenseService {
  async execute({ expense_id }: DetailExpenseRequest) {
    if (!expense_id) {
      throw new Error("ID da despesa é obrigatório");
    }

    const expense = await prismaClient.expense.findFirst({
      where: { id: expense_id },
      include: expenseInclude,
    });

    if (!expense) {
      throw new Error("Despesa não encontrada");
    }

    return expense;
  }
}

export { DetailExpenseService };
