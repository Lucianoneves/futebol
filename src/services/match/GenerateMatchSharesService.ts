import prismaClient from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";
import { dayRange, splitEvenly } from "../../utils/date";
import { matchInclude, presentMatch, byName } from "./matchInclude";

interface GenerateMatchSharesRequest {
  match_id: string;
}

class GenerateMatchSharesService {
  async execute({ match_id }: GenerateMatchSharesRequest) {
    if (!match_id) {
      throw new Error("ID da pelada é obrigatório");
    }

    const match = await prismaClient.match.findFirst({
      where: { id: match_id },
      include: matchInclude,
    });

    if (!match) {
      throw new Error("Pelada não encontrada");
    }

    const attendees = match.players
      .map((item) => item.player)
      .filter(Boolean)
      .sort(byName);

    if (attendees.length === 0) {
      throw new Error("Marque quem jogou antes de gerar o rateio");
    }

    const { start, end } = dayRange(match.playedOn);
    const expenses = await prismaClient.expense.findMany({
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
      throw new Error("Não há despesas neste dia para ratear");
    }

    const amounts = splitEvenly(total, attendees.length);
    const paidShares = match.shares.filter(
      (share) => share.status === PaymentStatus.PAID
    );

    if (paidShares.length > 0) {
      const samePlayers =
        paidShares.length === attendees.length &&
        attendees.every((player) =>
          paidShares.some((share) => share.playerId === player.id)
        );
      const sameTotal =
        Number(
          match.shares
            .filter((share) => share.status !== PaymentStatus.CANCELLED)
            .reduce((sum, share) => sum + Number(share.amount), 0)
            .toFixed(2)
        ) === total;

      if (samePlayers && sameTotal) {
        return {
          ...presentMatch(match),
          total,
          player_count: attendees.length,
          already_existed: true,
        };
      }

      throw new Error(
        "Há rateio já pago. Cancele os pagamentos para recalcular."
      );
    }

    const updated = await prismaClient.$transaction(async (tx) => {
      await tx.cashFlow.deleteMany({
        where: { matchShare: { matchId: match.id } },
      });
      await tx.matchShare.deleteMany({
        where: { matchId: match.id },
      });
      await tx.matchShare.createMany({
        data: attendees.map((player, index) => ({
          matchId: match.id,
          playerId: player.id,
          amount: amounts[index],
        })),
      });

      return tx.match.findFirst({
        where: { id: match.id },
        include: matchInclude,
      });
    });

    if (!updated) {
      throw new Error("Não foi possível gerar o rateio");
    }

    return {
      ...presentMatch(updated),
      total,
      player_count: attendees.length,
      already_existed: false,
    };
  }
}

export { GenerateMatchSharesService };
