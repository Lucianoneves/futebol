import prismaClient from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";
import { dayRange, splitEvenly } from "../../utils/date";
import { byName, playerNameSelect, withRemaining } from "./matchInclude";

interface CancelMatchShareRequest {
  share_id: string;
}

class CancelMatchShareService {
  async execute({ share_id }: CancelMatchShareRequest) {
    if (!share_id) {
      throw new Error("ID do rateio é obrigatório");
    }

    const share = await prismaClient.matchShare.findFirst({
      where: { id: share_id },
      include: {
        cashFlow: true,
        match: true,
      },
    });

    if (!share) {
      throw new Error("Rateio não encontrado");
    }

    if (share.status === PaymentStatus.CANCELLED) {
      throw new Error("Rateio já está cancelado");
    }

    const shareCancelled = await prismaClient.$transaction(async (tx) => {
      if (share.cashFlow) {
        await tx.cashFlow.delete({
          where: { id: share.cashFlow.id },
        });
      }

      const cancelled = await tx.matchShare.update({
        where: { id: share_id },
        data: {
          status: PaymentStatus.CANCELLED,
          paidAmount: 0,
          paidAt: null,
        },
        include: {
          player: {
            select: playerNameSelect,
          },
          match: {
            select: {
              id: true,
              playedOn: true,
            },
          },
        },
      });

      await tx.matchPlayer.deleteMany({
        where: {
          matchId: share.matchId,
          playerId: share.playerId,
        },
      });

      const remaining = (
        await tx.matchShare.findMany({
          where: {
            matchId: share.matchId,
            status: { not: PaymentStatus.CANCELLED },
          },
          include: {
            player: {
              select: playerNameSelect,
            },
          },
        })
      ).sort((left, right) => byName(left.player, right.player));

      if (remaining.length === 0) {
        return cancelled;
      }

      const { start, end } = dayRange(share.match.playedOn);
      const expenses = await tx.expense.findMany({
        where: {
          spentAt: { gte: start, lt: end },
          fromMonthlyCash: false,
        },
      });
      const total = Number(
        expenses
          .reduce((sum, item) => sum + Number(item.amount), 0)
          .toFixed(2)
      );

      if (total <= 0) {
        return cancelled;
      }

      const amounts = splitEvenly(total, remaining.length);

      for (const [index, item] of remaining.entries()) {
        const nextAmount = amounts[index];
        const paidAmount = Number(item.paidAmount || 0);
        const fullyPaid = paidAmount >= nextAmount && nextAmount > 0;

        await tx.matchShare.update({
          where: { id: item.id },
          data: {
            amount: nextAmount,
            status: fullyPaid
              ? PaymentStatus.PAID
              : item.status === PaymentStatus.PAID
                ? PaymentStatus.PENDING
                : item.status,
          },
        });
      }

      return cancelled;
    });

    return withRemaining(shareCancelled);
  }
}

export { CancelMatchShareService };
