import prismaClient from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";
import { withRemaining } from "../match/matchInclude";

interface ListPlayerShareRequest {
  user_id: string;
}

class ListPlayerShareService {
  async execute({ user_id }: ListPlayerShareRequest) {
    const user = await prismaClient.user.findFirst({
      where: { id: user_id },
      select: { playerId: true },
    });

    if (!user?.playerId) {
      throw new Error("Conta sem jogador vinculado");
    }

    const shares = await prismaClient.matchShare.findMany({
      where: {
        playerId: user.playerId,
        status: { not: PaymentStatus.CANCELLED },
      },
      include: {
        match: {
          select: { id: true, playedOn: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return shares
      .sort((left, right) =>
        right.match.playedOn.localeCompare(left.match.playedOn)
      )
      .map((share) =>
        withRemaining({
          id: share.id,
          matchId: share.matchId,
          playedOn: share.match.playedOn,
          amount: Number(share.amount),
          paidAmount: Number(share.paidAmount),
          status: share.status,
          paidAt: share.paidAt,
        })
      );
  }
}

export { ListPlayerShareService };
