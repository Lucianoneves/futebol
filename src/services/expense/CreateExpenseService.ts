import prismaClient from "../../prisma";
import { CashFlowType } from "../../generated/prisma/enums";

interface CreateExpenseRequest {
  expense_type_id: string;
  amount: number;
  spentAt?: string;
}

class CreateExpenseService {
  async execute({
    expense_type_id,
    amount,
    spentAt,
  }: CreateExpenseRequest) {
    if (!expense_type_id || amount === undefined) {
      throw new Error("Tipo e valor são obrigatórios");
    }

    if (amount <= 0) {
      throw new Error("Valor da despesa inválido");
    }

    const expenseType = await prismaClient.expenseType.findFirst({
      where: { id: expense_type_id, active: true },
    });

    if (!expenseType) {
      throw new Error("Tipo de despesa não encontrado");
    }

    const date = spentAt ? new Date(spentAt) : new Date();

    if (Number.isNaN(date.getTime())) {
      throw new Error("Data da despesa inválida");
    }

    const expense = await prismaClient.expense.create({
      data: {
        description: expenseType.name,
        expenseTypeId: expense_type_id,
        amount,
        spentAt: date,
        cashFlow: {
          create: {
            type: CashFlowType.OUTCOME,
            amount,
            description: `Despesa: ${expenseType.name}`,
            date,
          },
        },
      },
      include: {
        expenseType: true,
        cashFlow: true,
      },
    });

    return expense;
  }
}

export { CreateExpenseService };
