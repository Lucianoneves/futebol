import prismaClient from "../../prisma";
import { PaymentStatus, PlayerType } from "../../generated/prisma/enums";
import { ApplyOverduePaymentsService } from "../payment/ApplyOverduePaymentsService";
import { feeFromPlayer } from "../player/playerFees";
import { assertYearMonth, isCompetenceBillingOpen, isCompetenceOverdue } from "../../utils/date";

interface MonthlyReportRequest {
  year: number;
  month: number;
}

class MonthlyReportService {
  async execute({ year, month }: MonthlyReportRequest) {
    assertYearMonth(year, month);

    const applyOverduePaymentsService = new ApplyOverduePaymentsService();
    await applyOverduePaymentsService.execute();

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
    let expectedTotal = 0;
    let pendingTotal = 0;
    let pendingCount = 0;

    const billingOpen = isCompetenceBillingOpen(year, month);

    for (const player of players) {
      const payment = player.payments.find(
        (item) => item.status !== PaymentStatus.CANCELLED
      );
      const paidAmount = payment ? Number(payment.paidAmount || 0) : 0;
      const unpaidPending =
        payment?.status === PaymentStatus.PENDING && paidAmount <= 0;

      if (
        player.type === PlayerType.MONTHLY &&
        !billingOpen &&
        (!payment || unpaidPending)
      ) {
        continue;
      }

      const monthlyMissing =
        player.type === PlayerType.MONTHLY && !payment && billingOpen;
      const amount = payment
        ? Number(payment.amount)
        : monthlyMissing
          ? feeFromPlayer(player)
          : 0;
      const remaining = Number(Math.max(0, amount - paidAmount).toFixed(2));
      const status = payment
        ? payment.status
        : monthlyMissing
          ? isCompetenceOverdue(year, month)
            ? PaymentStatus.OVERDUE
            : PaymentStatus.PENDING
          : "MISSING";

      if (payment || monthlyMissing) {
        paidTotal += paidAmount;
        expectedTotal += amount;
        pendingTotal += remaining;
      }

      const item = {
        player_id: player.id,
        name: player.name,
        type: player.type,
        payment_id: payment?.id ?? null,
        amount: payment || monthlyMissing ? amount : null,
        paidAmount,
        status,
        paidAt: payment?.paidAt ?? null,
      };

      if (payment?.status === PaymentStatus.PAID) {
        paid.push(item);
      } else {
        owing.push(item);
        if (payment || monthlyMissing) pendingCount += 1;
      }
    }

    return {
      year,
      month,
      summary: {
        totalPlayers: players.length,
        paidCount: paid.length,
        owingCount: owing.length,
        pendingCount,
        paidTotal: Number(paidTotal.toFixed(2)),
        pendingTotal: Number(pendingTotal.toFixed(2)),
        expectedTotal: Number(expectedTotal.toFixed(2)),
      },
      paid,
      owing,
    };
  }
}

export { MonthlyReportService };
