import prismaClient from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";

interface ListPaymentRequest {
  player_id?: string;
  year?: number;
  month?: number;
  status?: string;
}

class ListPaymentService {
  async execute({ player_id, year, month, status }: ListPaymentRequest) {
    if (
      status &&
      status !== PaymentStatus.PENDING &&
      status !== PaymentStatus.PAID &&
      status !== PaymentStatus.OVERDUE &&
      status !== PaymentStatus.CANCELLED
    ) {
      throw new Error("Status inválido");
    }

    const payments = await prismaClient.payment.findMany({
      where: {
        ...(player_id && { playerId: player_id }),
        ...(year && { year }),
        ...(month && { month }),
        ...(status && { status: status as PaymentStatus }),
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
      orderBy: [{ player: { name: "asc" } }, { year: "desc" }, { month: "desc" }],
    });

    return payments.map((payment) => ({
      ...payment,
      remaining: Number(
        (Number(payment.amount) - Number(payment.paidAmount)).toFixed(2)
      ),
    }));
  }
}

export { ListPaymentService };
