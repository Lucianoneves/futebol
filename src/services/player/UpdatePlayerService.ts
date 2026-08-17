import prismaClient from "../../prisma";
import { PaymentStatus, PlayerType } from "../../generated/prisma/enums";
import { isPlayerType, resolvePlayerFees } from "./playerFees";
import { CancelPaymentService } from "../payment/CancelPaymentService";

interface UpdatePlayerRequest {
  player_id: string;
  name?: string;
  email?: string;
  phone?: string;
  type?: string;
  monthlyFee?: number;
  casualFee?: number;
}

class UpdatePlayerService {
  async execute({
    player_id,
    name,
    email,
    phone,
    type,
    monthlyFee,
    casualFee,
  }: UpdatePlayerRequest) {
    if (!player_id) {
      throw new Error("ID do jogador é obrigatório");
    }

    const player = await prismaClient.player.findFirst({
      where: { id: player_id },
    });

    if (!player) {
      throw new Error("Jogador não encontrado");
    }

    if (type && !isPlayerType(type)) {
      throw new Error("Tipo deve ser MONTHLY, CASUAL ou FEES");
    }

    if (email) {
      const emailAlreadyExists = await prismaClient.player.findFirst({
        where: {
          email,
          NOT: { id: player_id },
        },
      });

      if (emailAlreadyExists) {
        throw new Error("E-mail já cadastrado para outro jogador");
      }
    }

    const nextType = type ? (type as PlayerType) : player.type;
    const fees = type
      ? await resolvePlayerFees(nextType)
      : {
          monthlyFee: player.monthlyFee,
          casualFee: player.casualFee,
        };

    const playerUpdated = await prismaClient.player.update({
      where: { id: player_id },
      data: {
        name: name ?? player.name,
        email: email !== undefined ? email || null : player.email,
        phone: phone !== undefined ? phone || null : player.phone,
        type: nextType,
        monthlyFee:
          nextType === PlayerType.FEES
            ? null
            : monthlyFee !== undefined
              ? monthlyFee
              : fees.monthlyFee,
        casualFee:
          nextType === PlayerType.FEES
            ? null
            : casualFee !== undefined
              ? casualFee
              : fees.casualFee,
      },
    });

    if (player.type !== PlayerType.FEES && nextType === PlayerType.FEES) {
      const openPayments = await prismaClient.payment.findMany({
        where: {
          playerId: player_id,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
          paidAmount: 0,
        },
      });
      const cancelPaymentService = new CancelPaymentService();
      for (const payment of openPayments) {
        await cancelPaymentService.execute({ payment_id: payment.id });
      }
    }

    return playerUpdated;
  }
}

export { UpdatePlayerService };
