import prismaClient from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";
import { AddPaymentValueService } from "./AddPaymentValueService";
import { feeFromPlayer } from "../player/playerFees";
import { assertYearMonth } from "../../utils/date";
import { paymentPlayerInclude, withRemaining } from "../match/matchInclude";

interface CreatePaymentRequest {
  player_id: string;
  year: number;
  month: number;
  amount?: number;
  paid_amount?: number;
  notes?: string;
}

class CreatePaymentService {
  async execute({
    player_id,
    year,
    month,
    amount,
    paid_amount,
    notes,
  }: CreatePaymentRequest) {
    if (!player_id) {
      throw new Error("Jogador, ano e mês são obrigatórios");
    }

    assertYearMonth(year, month, "Jogador, ano e mês são obrigatórios");

    const player = await prismaClient.player.findFirst({
      where: { id: player_id },
    });

    if (!player) {
      throw new Error("Jogador não encontrado");
    }

    if (!player.active) {
      throw new Error("Jogador está desativado");
    }

    const finalAmount = amount !== undefined ? amount : feeFromPlayer(player);

    if (!finalAmount || finalAmount <= 0) {
      throw new Error("Valor do pagamento inválido");
    }

    const existing = await prismaClient.payment.findFirst({
      where: {
        playerId: player_id,
        year,
        month,
      },
      include: paymentPlayerInclude,
    });

    if (existing?.status === PaymentStatus.PAID && !paid_amount) {
      throw new Error(
        "Este jogador já quitou este mês. Use Editar para somar ou subtrair."
      );
    }

    let payment = existing;

    if (existing?.status === PaymentStatus.CANCELLED) {
      payment = await prismaClient.payment.update({
        where: { id: existing.id },
        data: {
          status: PaymentStatus.PENDING,
          paidAmount: 0,
          paidAt: null,
          amount: finalAmount,
          notes: notes || existing.notes,
        },
        include: paymentPlayerInclude,
      });
    } else if (!existing) {
      payment = await prismaClient.payment.create({
        data: {
          playerId: player_id,
          year,
          month,
          amount: finalAmount,
          notes: notes || null,
        },
        include: paymentPlayerInclude,
      });
    } else if (notes) {
      payment = await prismaClient.payment.update({
        where: { id: existing.id },
        data: { notes },
        include: paymentPlayerInclude,
      });
    }

    if (!payment) {
      throw new Error("Não foi possível gerar o pagamento");
    }

    if (paid_amount && paid_amount > 0) {
      const addPaymentValueService = new AddPaymentValueService();
      return addPaymentValueService.execute({
        payment_id: payment.id,
        value: paid_amount,
      });
    }

    return {
      ...withRemaining(payment),
      already_existed: Boolean(existing && existing.status !== PaymentStatus.CANCELLED),
    };
  }
}

export { CreatePaymentService };
