import prismaClient from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";
import { paymentPlayerInclude, withRemaining } from "../match/matchInclude";

interface UpdatePaymentRequest {
  payment_id: string;
  amount?: number;
  notes?: string;
}

class UpdatePaymentService {
  async execute({ payment_id, amount, notes }: UpdatePaymentRequest) {
    if (!payment_id) {
      throw new Error("ID do pagamento é obrigatório");
    }

    const payment = await prismaClient.payment.findFirst({
      where: { id: payment_id },
    });

    if (!payment) {
      throw new Error("Pagamento não encontrado");
    }

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new Error("Não é possível editar pagamento cancelado");
    }

    if (amount !== undefined && amount <= 0) {
      throw new Error("Valor do pagamento inválido");
    }

    const nextAmount =
      amount !== undefined ? amount : Number(payment.amount);
    const paidAmount = Number(payment.paidAmount);

    if (nextAmount < paidAmount) {
      throw new Error(
        `Valor total não pode ser menor que o já pago (${paidAmount.toFixed(2)})`
      );
    }

    let nextStatus = payment.status;
    let paidAt = payment.paidAt;

    if (paidAmount >= nextAmount && paidAmount > 0) {
      nextStatus = PaymentStatus.PAID;
      paidAt = paidAt ?? new Date();
    } else if (payment.status === PaymentStatus.PAID && paidAmount < nextAmount) {
      nextStatus = PaymentStatus.PENDING;
      paidAt = null;
    }

    const paymentUpdated = await prismaClient.payment.update({
      where: { id: payment_id },
      data: {
        amount: nextAmount,
        notes: notes !== undefined ? notes || null : payment.notes,
        status: nextStatus,
        paidAt,
      },
      include: paymentPlayerInclude,
    });

    return withRemaining(paymentUpdated);
  }
}

export { UpdatePaymentService };
