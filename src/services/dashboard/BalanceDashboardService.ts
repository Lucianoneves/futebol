import prismaClient from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";
import {
  competenceLabel,
  formatIsoDayBr,
  isoDay,
  monthRange,
} from "../../utils/date";

interface BalanceDashboardRequest {
  year?: number;
  month?: number;
}

class BalanceDashboardService {
  async execute({ year, month }: BalanceDashboardRequest) {
    const now = new Date();
    const selectedYear = year ?? now.getFullYear();
    const selectedMonth = month ?? now.getMonth() + 1;
    const { start, end } = monthRange(selectedYear, selectedMonth);

    const [
      monthPayments,
      prepaidPayments,
      boxPayments,
      monthExpenses,
      expensesUntilMonth,
      monthShares,
      boxShares,
    ] = await Promise.all([
        prismaClient.payment.findMany({
          where: {
            year: selectedYear,
            month: selectedMonth,
            status: { not: PaymentStatus.CANCELLED },
          },
          include: {
            player: { select: { name: true } },
          },
          orderBy: { paidAt: "desc" },
        }),
        prismaClient.payment.findMany({
          where: {
            status: { not: PaymentStatus.CANCELLED },
            paidAmount: { gt: 0 },
            paidAt: { gte: start, lt: end },
            OR: [
              { year: { gt: selectedYear } },
              { year: selectedYear, month: { gt: selectedMonth } },
            ],
          },
          include: {
            player: { select: { name: true } },
          },
        }),
        prismaClient.payment.findMany({
          where: {
            status: { not: PaymentStatus.CANCELLED },
            paidAmount: { gt: 0 },
            OR: [
              { year: { lt: selectedYear } },
              { year: selectedYear, month: { lte: selectedMonth } },
              { paidAt: { not: null, lt: end } },
            ],
          },
        }),
        prismaClient.expense.findMany({
          where: {
            spentAt: { gte: start, lt: end },
          },
          orderBy: { spentAt: "desc" },
        }),
        prismaClient.expense.findMany({
          where: {
            spentAt: { lt: end },
          },
        }),
        prismaClient.matchShare.findMany({
          where: {
            status: { not: PaymentStatus.CANCELLED },
            match: {
              playedOn: {
                gte: isoDay(start),
                lt: isoDay(end),
              },
            },
          },
          include: {
            player: { select: { name: true } },
            match: { select: { playedOn: true } },
          },
        }),
        prismaClient.matchShare.findMany({
          where: {
            status: { not: PaymentStatus.CANCELLED },
            paidAmount: { gt: 0 },
            match: {
              playedOn: { lt: isoDay(end) },
            },
          },
        }),
      ]);

    const income = round(
      monthPayments.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0) +
        monthShares.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0)
    );
    const outcome = round(
      monthExpenses.reduce((sum, item) => sum + Number(item.amount), 0)
    );
    const prepaid = round(
      prepaidPayments.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0)
    );
    const collectedUntilMonth = round(
      boxPayments.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0) +
        boxShares.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0)
    );
    const spentUntilMonth = round(
      expensesUntilMonth.reduce((sum, item) => sum + Number(item.amount), 0)
    );
    const remaining = round(collectedUntilMonth - spentUntilMonth);

    const transactions = [
      ...monthPayments
        .filter((item) => Number(item.paidAmount || 0) > 0)
        .map((item) => ({
          id: item.id,
          type: "INCOME" as const,
          amount: Number(item.paidAmount),
          description: `Pagamento ${competenceLabel(item.month, item.year)} - ${item.player.name}`,
          date: item.paidAt ?? item.updatedAt,
        })),
      ...monthShares
        .filter((item) => Number(item.paidAmount || 0) > 0)
        .map((item) => ({
          id: item.id,
          type: "INCOME" as const,
          amount: Number(item.paidAmount),
          description: `Rateio ${formatIsoDayBr(item.match.playedOn)} - ${item.player.name}`,
          date: item.paidAt ?? item.updatedAt,
        })),
      ...prepaidPayments.map((item) => ({
        id: `prepaid-${item.id}`,
        type: "PREPAID" as const,
        amount: Number(item.paidAmount),
        description: `Adiantado ${competenceLabel(item.month, item.year)} - ${item.player.name}`,
        date: item.paidAt ?? item.updatedAt,
      })),
      ...monthExpenses.map((item) => ({
        id: item.id,
        type: "OUTCOME" as const,
        amount: Number(item.amount),
        description: item.description,
        date: item.spentAt,
      })),
    ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

    return {
      filter: {
        year: selectedYear,
        month: selectedMonth,
      },
      income,
      outcome,
      prepaid,
      monthBalance: round(income - outcome),
      remaining,
      balance: remaining,
      transactions,
    };
  }
}

function round(value: number) {
  return Number(value.toFixed(2));
}

export { BalanceDashboardService };
