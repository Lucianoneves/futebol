import prismaClient from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";
import { ApplyOverduePaymentsService } from "./ApplyOverduePaymentsService";
import { paymentPlayerInclude, withRemaining } from "../match/matchInclude";

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

    const applyOverduePaymentsService = new ApplyOverduePaymentsService();
    await applyOverduePaymentsService.execute();

    const payments = await prismaClient.payment.findMany({
      where: {
        ...(player_id && { playerId: player_id }),
        ...(year && { year }),
        ...(month && { month }),
        ...(status && { status: status as PaymentStatus }),
      },
      include: paymentPlayerInclude,
      orderBy: [{ player: { name: "asc" } }, { year: "desc" }, { month: "desc" }],
    });

    return payments.map(withRemaining);
  }
}

export { ListPaymentService };
