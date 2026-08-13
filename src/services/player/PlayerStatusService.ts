import prismaClient from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";
import { ApplyOverduePaymentsService } from "../payment/ApplyOverduePaymentsService";
import { PlayerYearHistoryService } from "./PlayerYearHistoryService";
import { withRemaining } from "../match/matchInclude";
import { assertMonth } from "../../utils/date";

interface PlayerStatusRequest {
  user_id: string;
  year?: number;
  month?: number;
}

class PlayerStatusService {
  async execute({ user_id, year, month }: PlayerStatusRequest) {
    const now = new Date();
    const selectedYear = year ?? now.getFullYear();
    const selectedMonth = month ?? now.getMonth() + 1;
    assertMonth(selectedMonth);

    const user = await prismaClient.user.findFirst({
      where: { id: user_id },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            type: true,
            active: true,
          },
        },
      },
    });

    if (!user?.playerId || !user.player) {
      throw new Error("Conta sem jogador vinculado");
    }

    await new ApplyOverduePaymentsService().execute();

    const history = await new PlayerYearHistoryService().execute({
      player_id: user.player.id,
      year: selectedYear,
    });

    const monthPayment =
      history.months.find((item) => item.month === selectedMonth)?.payment ||
      null;

    const shares = await prismaClient.matchShare.findMany({
      where: {
        playerId: user.player.id,
        status: { not: PaymentStatus.CANCELLED },
      },
      include: {
        match: {
          select: { id: true, playedOn: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
    const monthShares = shares
      .filter((share) => share.match.playedOn.startsWith(monthPrefix))
      .map(mapShare);

    const openShares = shares
      .filter((share) => share.status !== PaymentStatus.PAID)
      .map(mapShare);

    const shareOpen = monthShares.some(
      (share) => share.status !== PaymentStatus.PAID
    );

    let situation: "PAID" | "PENDING" | "OVERDUE" = "PAID";
    if (monthPayment?.status === PaymentStatus.OVERDUE) {
      situation = "OVERDUE";
    } else if (
      (monthPayment &&
        monthPayment.status !== PaymentStatus.PAID &&
        monthPayment.status !== PaymentStatus.CANCELLED) ||
      shareOpen
    ) {
      situation = "PENDING";
    }

    return {
      player: user.player,
      year: selectedYear,
      month: selectedMonth,
      overdue_day: history.overdue_day,
      situation,
      payment: monthPayment,
      months: history.months,
      month_shares: monthShares,
      open_shares: openShares,
    };
  }
}

export { PlayerStatusService };

function mapShare(share: {
  id: string;
  amount: unknown;
  paidAmount: unknown;
  status: PaymentStatus;
  paidAt: Date | null;
  match: { playedOn: string };
}) {
  return withRemaining({
    id: share.id,
    playedOn: share.match.playedOn,
    amount: Number(share.amount),
    paidAmount: Number(share.paidAmount),
    status: share.status,
    paidAt: share.paidAt,
  });
}
