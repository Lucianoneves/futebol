import prismaClient from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";
import { isCompetenceOverdue } from "../../utils/date";

class ApplyOverduePaymentsService {
  async execute(now = new Date()) {
    const pending = await prismaClient.payment.findMany({
      where: { status: PaymentStatus.PENDING },
      select: { id: true, year: true, month: true },
    });

    const ids = pending
      .filter((payment) => isCompetenceOverdue(payment.year, payment.month, now))
      .map((payment) => payment.id);

    if (ids.length === 0) {
      return { updated: 0 };
    }

    const result = await prismaClient.payment.updateMany({
      where: {
        id: { in: ids },
        status: PaymentStatus.PENDING,
      },
      data: { status: PaymentStatus.OVERDUE },
    });

    return { updated: result.count };
  }
}

export { ApplyOverduePaymentsService };
