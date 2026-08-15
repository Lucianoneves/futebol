import { CashFlowType } from "../../generated/prisma/enums";

export function monthlyExpenseCashFlowData(
  typeName: string,
  amount: number,
  date: Date
) {
  return {
    type: CashFlowType.OUTCOME,
    amount,
    description: `Despesa: ${typeName}`,
    date,
  };
}

export function monthlyCashRelation(
  fromMonthlyCash: boolean,
  hasCashFlow: boolean,
  data: ReturnType<typeof monthlyExpenseCashFlowData>
) {
  if (fromMonthlyCash) {
    return hasCashFlow
      ? { cashFlow: { update: data } }
      : { cashFlow: { create: data } };
  }

  return hasCashFlow ? { cashFlow: { delete: true } } : {};
}
