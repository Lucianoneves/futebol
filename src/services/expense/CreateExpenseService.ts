import prismaClient, { expenseInclude } from "../../prisma";
import { parseSpentAt } from "../../utils/date";
import {
  monthlyCashRelation,
  monthlyExpenseCashFlowData,
} from "./monthlyExpenseCash";

interface CreateExpenseRequest {
  expense_type_id: string;
  amount: number;
  spentAt?: string;
  from_monthly_cash?: boolean;
}

class CreateExpenseService {
  async execute({
    expense_type_id,
    amount,
    spentAt,
    from_monthly_cash,
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

    const date = parseSpentAt(spentAt);
    const fromMonthlyCash = from_monthly_cash !== false;
    const cashFlowData = monthlyExpenseCashFlowData(
      expenseType.name,
      amount,
      date
    );

    const expense = await prismaClient.expense.create({
      data: {
        description: expenseType.name,
        expenseTypeId: expense_type_id,
        amount,
        spentAt: date,
        fromMonthlyCash,
        ...monthlyCashRelation(fromMonthlyCash, false, cashFlowData),
      },
      include: expenseInclude,
    });

    return expense;
  }
}

export { CreateExpenseService };
