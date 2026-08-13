import prismaClient from "../../prisma";

interface UpdateExpenseRequest {
  expense_id: string;
  expense_type_id?: string;
  amount?: number;
  spentAt?: string;
}

class UpdateExpenseService {
  async execute({
    expense_id,
    expense_type_id,
    amount,
    spentAt,
  }: UpdateExpenseRequest) {
    if (!expense_id) {
      throw new Error("ID da despesa é obrigatório");
    }

    const expense = await prismaClient.expense.findFirst({
      where: { id: expense_id },
      include: { cashFlow: true, expenseType: true },
    });

    if (!expense) {
      throw new Error("Despesa não encontrada");
    }

    if (amount !== undefined && amount <= 0) {
      throw new Error("Valor da despesa inválido");
    }

    let nextType = expense.expenseType;

    if (expense_type_id) {
      const expenseType = await prismaClient.expenseType.findFirst({
        where: { id: expense_type_id, active: true },
      });

      if (!expenseType) {
        throw new Error("Tipo de despesa não encontrado");
      }

      nextType = expenseType;
    }

    const nextSpentAt = spentAt ? new Date(spentAt) : expense.spentAt;

    if (spentAt && Number.isNaN(nextSpentAt.getTime())) {
      throw new Error("Data da despesa inválida");
    }

    const nextAmount = amount !== undefined ? amount : expense.amount;

    const expenseUpdated = await prismaClient.expense.update({
      where: { id: expense_id },
      data: {
        description: nextType.name,
        expenseTypeId: nextType.id,
        amount: nextAmount,
        spentAt: nextSpentAt,
        ...(expense.cashFlow
          ? {
              cashFlow: {
                update: {
                  amount: nextAmount,
                  description: `Despesa: ${nextType.name}`,
                  date: nextSpentAt,
                },
              },
            }
          : {}),
      },
      include: {
        expenseType: true,
        cashFlow: true,
      },
    });

    return expenseUpdated;
  }
}

export { UpdateExpenseService };
