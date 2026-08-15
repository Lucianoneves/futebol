import prismaClient, { expenseInclude } from "../../prisma";
import { parseSpentAt } from "../../utils/date";
import {
  monthlyCashRelation,
  monthlyExpenseCashFlowData,
} from "./monthlyExpenseCash";

interface UpdateExpenseRequest {
  expense_id: string;
  expense_type_id?: string;
  amount?: number;
  spentAt?: string;
  from_monthly_cash?: boolean;
}

class UpdateExpenseService {
  async execute({
    expense_id,
    expense_type_id,
    amount,
    spentAt,
    from_monthly_cash,
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

    const nextSpentAt = spentAt ? parseSpentAt(spentAt) : expense.spentAt;
    const nextAmount = amount !== undefined ? amount : Number(expense.amount);
    const fromMonthlyCash = from_monthly_cash ?? expense.fromMonthlyCash;
    const cashFlowData = monthlyExpenseCashFlowData(
      nextType.name,
      nextAmount,
      nextSpentAt
    );

    const expenseUpdated = await prismaClient.expense.update({
      where: { id: expense_id },
      data: {
        description: nextType.name,
        expenseTypeId: nextType.id,
        amount: nextAmount,
        spentAt: nextSpentAt,
        fromMonthlyCash,
        ...monthlyCashRelation(
          fromMonthlyCash,
          Boolean(expense.cashFlow),
          cashFlowData
        ),
      },
      include: expenseInclude,
    });

    return expenseUpdated;
  }
}

export { UpdateExpenseService };
