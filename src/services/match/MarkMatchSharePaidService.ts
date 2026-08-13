import prismaClient from "../../prisma";
import { CashFlowType, PaymentStatus } from "../../generated/prisma/enums";
import { playerNameSelect, withRemaining } from "./matchInclude";

interface MarkMatchSharePaidRequest {
  share_id: string;
}

class MarkMatchSharePaidService {
  async execute({ share_id }: MarkMatchSharePaidRequest) {
    if (!share_id) {
      throw new Error("ID do rateio é obrigatório");
    }

    const share = await prismaClient.matchShare.findFirst({
      where: { id: share_id },
      include: {
        player: true,
        match: true,
        cashFlow: true,
      },
    });

    if (!share) {
      throw new Error("Rateio não encontrado");
    }

    if (share.status === PaymentStatus.PAID) {
      throw new Error("Rateio já está marcado como pago");
    }

    if (share.status === PaymentStatus.CANCELLED) {
      throw new Error("Não é possível pagar um rateio cancelado");
    }

    const paidAt = new Date();
    const totalAmount = Number(share.amount);
    const description = `Rateio ${share.match.playedOn} - ${share.player.name}`;

    const sharePaid = await prismaClient.matchShare.update({
      where: { id: share_id },
      data: {
        status: PaymentStatus.PAID,
        paidAmount: totalAmount,
        paidAt,
        cashFlow: share.cashFlow
          ? {
              update: {
                amount: totalAmount,
                description,
                date: paidAt,
              },
            }
          : {
              create: {
                type: CashFlowType.INCOME,
                amount: totalAmount,
                description,
                date: paidAt,
              },
            },
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

    return withRemaining(sharePaid);
  }
}

export { MarkMatchSharePaidService };
