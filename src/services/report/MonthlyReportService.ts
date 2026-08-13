import prismaClient from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";

interface MonthlyReportRequest {
  year: number;
  month: number;
}

class MonthlyReportService {
  async execute({ year, month }: MonthlyReportRequest) {
    if (!year || !month) {
      throw new Error("Ano e mês são obrigatórios");
    }

    if (month < 1 || month > 12) {
      throw new Error("Mês deve ser entre 1 e 12");
    }

    const players = await prismaClient.player.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: {
        payments: {
          where: { year, month },
        },
      },
    });

    const paid = [];
    const owing = [];
    let paidTotal = 0;

    for (const player of players) {
      const payment = player.payments[0];
      const paidAmount = payment ? Number(payment.paidAmount || 0) : 0;

      if (payment && payment.status !== PaymentStatus.CANCELLED) {
        paidTotal += paidAmount;
      }

      const item = {
        player_id: player.id,
        name: player.name,
        type: player.type,
        payment_id: payment?.id ?? null,
        amount: payment ? Number(payment.amount) : null,
        paidAmount,
        status: payment?.status ?? "MISSING",
        paidAt: payment?.paidAt ?? null,
      };

      if (payment?.status === PaymentStatus.PAID) {
        paid.push(item);
      } else {
        owing.push(item);
      }
    }

    return {
      year,
      month,
      summary: {
        totalPlayers: players.length,
        paidCount: paid.length,
        owingCount: owing.length,
        paidTotal: Number(paidTotal.toFixed(2)),
      },
      paid,
      owing,
    };
  }
}

export { MonthlyReportService };
