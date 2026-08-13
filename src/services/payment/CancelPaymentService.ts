import prismaClient, { deleteCashFlowIfPresent } from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";
import { paymentPlayerInclude } from "../match/matchInclude";

interface CancelPaymentRequest {
  payment_id: string;
}

class CancelPaymentService {
  async execute({ payment_id }: CancelPaymentRequest) {
    if (!payment_id) {
      throw new Error("ID do pagamento é obrigatório");
    }

    const payment = await prismaClient.payment.findFirst({
      where: { id: payment_id },
      include: {
        cashFlow: true,
      },
    });

    if (!payment) {
      throw new Error("Pagamento não encontrado");
    }

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new Error("Pagamento já está cancelado");
    }

    await deleteCashFlowIfPresent(payment.cashFlow);

    const paymentCancelled = await prismaClient.payment.update({
      where: { id: payment_id },
      data: {
        status: PaymentStatus.CANCELLED,
        paidAmount: 0,
        paidAt: null,
      },
      include: paymentPlayerInclude,
    });

    return paymentCancelled;
  }
}

export { CancelPaymentService };
