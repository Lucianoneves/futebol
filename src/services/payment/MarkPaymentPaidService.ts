import prismaClient from "../../prisma";
import { CashFlowType, PaymentStatus } from "../../generated/prisma/enums";
import { paymentPlayerInclude } from "../match/matchInclude";

interface MarkPaymentPaidRequest {
  payment_id: string;
}

class MarkPaymentPaidService {
  async execute({ payment_id }: MarkPaymentPaidRequest) {
    if (!payment_id) {
      throw new Error("ID do pagamento é obrigatório");
    }

    const payment = await prismaClient.payment.findFirst({
      where: { id: payment_id },
      include: {
        player: true,
        cashFlow: true,
      },
    });

    if (!payment) {
      throw new Error("Pagamento não encontrado");
    }

    if (payment.status === PaymentStatus.PAID) {
      throw new Error("Pagamento já está marcado como pago");
    }

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new Error("Não é possível pagar um pagamento cancelado");
    }

    const paidAt = new Date();
    const totalAmount = Number(payment.amount);
    const description = `Pagamento ${payment.month}/${payment.year} - ${payment.player.name}`;

    const paymentPaid = await prismaClient.payment.update({
      where: { id: payment_id },
      data: {
        status: PaymentStatus.PAID,
        paidAmount: totalAmount,
        paidAt,
        cashFlow: payment.cashFlow
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
      include: paymentPlayerInclude,
    });

    return paymentPaid;
  }
}

export { MarkPaymentPaidService };
