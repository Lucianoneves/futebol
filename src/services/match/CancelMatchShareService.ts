import prismaClient, { deleteCashFlowIfPresent } from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";
import { playerNameSelect, withRemaining } from "./matchInclude";

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

    await deleteCashFlowIfPresent(share.cashFlow);

    const shareCancelled = await prismaClient.matchShare.update({
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

    return withRemaining(shareCancelled);
  }
}

export { CancelMatchShareService };
