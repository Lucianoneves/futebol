import prismaClient from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";
import { assertIsoDay } from "../../utils/date";
import { matchInclude, presentMatch } from "./matchInclude";

interface UpsertMatchRequest {
  playedOn: string;
  player_ids: string[];
  notes?: string;
}

class UpsertMatchService {
  async execute({ playedOn, player_ids, notes }: UpsertMatchRequest) {
    const day = assertIsoDay(playedOn);
    const uniqueIds = [...new Set(player_ids)];

    if (uniqueIds.length === 0) {
      throw new Error("Selecione quem jogou");
    }

    const players = await prismaClient.player.findMany({
      where: { id: { in: uniqueIds } },
    });

    if (players.length !== uniqueIds.length) {
      throw new Error("Jogador não encontrado");
    }

    const inactive = players.filter((player) => !player.active);
    if (inactive.length > 0) {
      throw new Error(
        `Jogador desativado: ${inactive.map((player) => player.name).join(", ")}`
      );
    }

    const match = await prismaClient.$transaction(async (tx) => {
      const saved = await tx.match.upsert({
        where: { playedOn: day },
        create: { playedOn: day, notes: notes || null },
        update: notes !== undefined ? { notes } : {},
      });

      const paidShare = await tx.matchShare.findFirst({
        where: {
          matchId: saved.id,
          status: PaymentStatus.PAID,
        },
      });

      if (paidShare) {
        const current = await tx.matchPlayer.findMany({
          where: { matchId: saved.id },
        });
        const currentIds = current.map((item) => item.playerId).sort();
        const nextIds = [...uniqueIds].sort();
        const sameAttendance =
          currentIds.length === nextIds.length &&
          currentIds.every((id, index) => id === nextIds[index]);

        if (!sameAttendance) {
          throw new Error(
            "Há rateio já pago. Cancele os pagamentos para alterar quem jogou."
          );
        }

        return tx.match.findFirst({
          where: { id: saved.id },
          include: matchInclude,
        });
      }

      await tx.matchPlayer.deleteMany({
        where: { matchId: saved.id },
      });
      await tx.matchPlayer.createMany({
        data: uniqueIds.map((playerId) => ({
          matchId: saved.id,
          playerId,
        })),
      });
      await tx.matchShare.deleteMany({
        where: {
          matchId: saved.id,
          status: { not: PaymentStatus.PAID },
          playerId: { notIn: uniqueIds },
        },
      });

      return tx.match.findFirst({
        where: { id: saved.id },
        include: matchInclude,
      });
    });

    if (!match) {
      throw new Error("Não foi possível salvar a pelada");
    }

    return presentMatch(match);
  }
}

export { UpsertMatchService };
