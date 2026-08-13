import prismaClient from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";

interface MarkPaymentOverdueRequest {
  payment_id: string;
}

class MarkPaymentOverdueService {
  async execute({ payment_id }: MarkPaymentOverdueRequest) {
    if (!payment_id) {
      throw new Error("ID do pagamento é obrigatório");
    }

    const payment = await prismaClient.payment.findFirst({
      where: { id: payment_id },
    });

    if (!payment) {
      throw new Error("Pagamento não encontrado");
    }

    if (payment.status === PaymentStatus.PAID) {
      throw new Error("Não é possível marcar como atrasado um pagamento já pago");
    }

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new Error("Não é possível marcar como atrasado um pagamento cancelado");
    }

    if (payment.status === PaymentStatus.OVERDUE) {
      throw new Error("Pagamento já está marcado como atrasado");
    }

    const paymentOverdue = await prismaClient.payment.update({
      where: { id: payment_id },
      data: {
        status: PaymentStatus.OVERDUE,
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return paymentOverdue;
  }
}

export { MarkPaymentOverdueService };
