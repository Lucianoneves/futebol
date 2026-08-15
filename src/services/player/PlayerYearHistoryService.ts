import prismaClient from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";
import { ApplyOverduePaymentsService } from "../payment/ApplyOverduePaymentsService";
import { isCompetenceBillingOpen, OVERDUE_DAY } from "../../utils/date";
import { withRemaining } from "../match/matchInclude";

interface PlayerYearHistoryRequest {
  player_id: string;
  year: number;
}

class PlayerYearHistoryService {
  async execute({ player_id, year }: PlayerYearHistoryRequest) {
    if (!player_id) {
      throw new Error("ID do jogador é obrigatório");
    }

    if (!year || year < 2000) {
      throw new Error("Ano inválido");
    }

    const player = await prismaClient.player.findFirst({
      where: { id: player_id },
      select: {
        id: true,
        name: true,
        type: true,
        active: true,
      },
    });

    if (!player) {
      throw new Error("Jogador não encontrado");
    }

    await new ApplyOverduePaymentsService().execute();

    const payments = await prismaClient.payment.findMany({
      where: { playerId: player_id, year },
      orderBy: { month: "asc" },
    });

    const byMonth = new Map(payments.map((payment) => [payment.month, payment]));

    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const payment = byMonth.get(month);

      if (!payment) {
        return { month, payment: null };
      }

      const unpaidPending =
        payment.status === PaymentStatus.PENDING &&
        Number(payment.paidAmount) <= 0;

      if (unpaidPending && !isCompetenceBillingOpen(year, month)) {
        return { month, payment: null };
      }

      return {
        month,
        payment: {
          id: payment.id,
          amount: Number(payment.amount),
          paidAmount: Number(payment.paidAmount),
          remaining: withRemaining(payment).remaining,
          status: payment.status,
          paidAt: payment.paidAt,
        },
      };
    });

    return {
      player,
      year,
      overdue_day: OVERDUE_DAY,
      months,
    };
  }
}

export { PlayerYearHistoryService };
