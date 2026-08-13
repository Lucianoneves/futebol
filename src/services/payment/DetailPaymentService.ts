import prismaClient from "../../prisma";

interface DetailPaymentRequest {
  payment_id: string;
}

class DetailPaymentService {
  async execute({ payment_id }: DetailPaymentRequest) {
    if (!payment_id) {
      throw new Error("ID do pagamento é obrigatório");
    }

    const payment = await prismaClient.payment.findFirst({
      where: { id: payment_id },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            type: true,
            email: true,
            phone: true,
          },
        },
        cashFlow: true,
      },
    });

    if (!payment) {
      throw new Error("Pagamento não encontrado");
    }

    return payment;
  }
}

export { DetailPaymentService };
