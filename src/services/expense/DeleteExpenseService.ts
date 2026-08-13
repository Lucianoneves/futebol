import prismaClient, { deleteCashFlowIfPresent } from "../../prisma";

interface DeleteExpenseRequest {
  expense_id: string;
}

class DeleteExpenseService {
  async execute({ expense_id }: DeleteExpenseRequest) {
    if (!expense_id) {
      throw new Error("ID da despesa é obrigatório");
    }

    const expense = await prismaClient.expense.findFirst({
      where: { id: expense_id },
      include: { cashFlow: true },
    });

    if (!expense) {
      throw new Error("Despesa não encontrada");
    }

    await deleteCashFlowIfPresent(expense.cashFlow);

    await prismaClient.expense.delete({
      where: { id: expense_id },
    });

    return { message: "Despesa removida com sucesso" };
  }
}

export { DeleteExpenseService };
