import prismaClient from "../../prisma";
import { CashFlowType } from "../../generated/prisma/enums";

interface BalanceDashboardRequest {
  year?: number;
  month?: number;
}

class BalanceDashboardService {
  async execute({ year, month }: BalanceDashboardRequest) {
    if (month !== undefined && (month < 1 || month > 12)) {
      throw new Error("Mês deve ser entre 1 e 12");
    }

    if (month !== undefined && !year) {
      throw new Error("Informe o ano junto com o mês");
    }

    let dateFilter = {};

    if (year && month) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);

      dateFilter = {
        date: {
          gte: start,
          lt: end,
        },
      };
    } else if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);

      dateFilter = {
        date: {
          gte: start,
          lt: end,
        },
      };
    }

    const cashFlows = await prismaClient.cashFlow.findMany({
      where: dateFilter,
      orderBy: { date: "desc" },
    });

    const income = cashFlows
      .filter((item) => item.type === CashFlowType.INCOME)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const outcome = cashFlows
      .filter((item) => item.type === CashFlowType.OUTCOME)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      filter: {
        year: year ?? null,
        month: month ?? null,
      },
      income,
      outcome,
      balance: income - outcome,
      transactions: cashFlows.map((item) => ({
        id: item.id,
        type: item.type,
        amount: Number(item.amount),
        description: item.description,
        date: item.date,
      })),
    };
  }
}

export { BalanceDashboardService };
