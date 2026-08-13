import prismaClient from "../../prisma";
import { CashFlowType, PaymentStatus, PlayerType } from "../../generated/prisma/enums";
import { competenceLabel, nextCompetence } from "../../utils/date";
import { feeFromPlayer } from "../player/playerFees";

interface AddPaymentValueRequest {
  payment_id: string;
  value: number;
}

class AddPaymentValueService {
  async execute({ payment_id, value }: AddPaymentValueRequest) {
    if (!payment_id) {
      throw new Error("ID do pagamento é obrigatório");
    }

    if (!value || value === 0) {
      throw new Error("Informe um valor para somar ou subtrair");
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

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new Error("Não é possível alterar um pagamento cancelado");
    }

    if (value < 0) {
      return this.subtract(payment, Math.abs(value));
    }

    return this.add(payment, value);
  }

  private async subtract(payment: NonNullable<Awaited<ReturnType<typeof prismaClient.payment.findFirst>>> & {
    player: { name: string };
    cashFlow: { id: string } | null;
  }, amount: number) {
    const currentPaid = Number(payment.paidAmount);
    const nextPaid = Number((currentPaid - amount).toFixed(2));

    if (nextPaid < 0) {
      throw new Error(
        `Não dá para subtrair ${amount.toFixed(2)}. Pago atual: ${currentPaid.toFixed(2)}`
      );
    }

    const totalAmount = Number(payment.amount);
    const isFullyPaid = nextPaid >= totalAmount && nextPaid > 0;
    let nextStatus = payment.status;
    let paidAt = payment.paidAt;

    if (isFullyPaid) {
      nextStatus = PaymentStatus.PAID;
      paidAt = paidAt ?? new Date();
    } else if (payment.status === PaymentStatus.OVERDUE) {
      nextStatus = PaymentStatus.OVERDUE;
      paidAt = nextPaid > 0 ? paidAt : null;
    } else {
      nextStatus = PaymentStatus.PENDING;
      paidAt = nextPaid > 0 ? paidAt : null;
    }

    const cashFlowDescription = `Pagamento ${payment.month}/${payment.year} - ${payment.player.name}`;

    const paymentUpdated = await prismaClient.payment.update({
      where: { id: payment.id },
      data: {
        paidAmount: nextPaid,
        status: nextStatus,
        paidAt,
        ...(payment.cashFlow
          ? nextPaid > 0
            ? {
                cashFlow: {
                  update: {
                    amount: nextPaid,
                    description: cashFlowDescription,
                    date: new Date(),
                  },
                },
              }
            : {}
          : {}),
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

    if (payment.cashFlow && nextPaid <= 0) {
      await prismaClient.cashFlow.delete({
        where: { id: payment.cashFlow.id },
      });
    }

    return {
      ...paymentUpdated,
      remaining: Number(
        (Number(paymentUpdated.amount) - Number(paymentUpdated.paidAmount)).toFixed(2)
      ),
      carry_over: [],
    };
  }

  private async add(
    origin: NonNullable<Awaited<ReturnType<typeof prismaClient.payment.findFirst>>> & {
      player: {
        id: string;
        name: string;
        type: PlayerType;
        monthlyFee: unknown;
        casualFee: unknown;
        active: boolean;
      };
      cashFlow: { id: string } | null;
    },
    value: number
  ) {
    const canCarry =
      origin.player.type === PlayerType.MONTHLY &&
      origin.status !== PaymentStatus.OVERDUE;

    let leftover = Number(value.toFixed(2));
    let currentId = origin.id;
    const carry_over: Array<{ year: number; month: number; amount: number }> = [];
    let guard = 0;

    while (leftover > 0.001 && guard < 12) {
      guard += 1;
      const current = await prismaClient.payment.findFirst({
        where: { id: currentId },
        include: { player: true, cashFlow: true },
      });

      if (!current) {
        throw new Error("Pagamento não encontrado");
      }

      const remaining = Number(
        (Number(current.amount) - Number(current.paidAmount)).toFixed(2)
      );

      if (remaining <= 0) {
        if (!canCarry) {
          throw new Error("Pagamento já está quitado");
        }

        const next = await this.ensureNextMonth(current);
        currentId = next.id;
        continue;
      }

      const chunk = Number(Math.min(leftover, remaining).toFixed(2));
      await this.applyChunk(current, chunk);
      leftover = Number((leftover - chunk).toFixed(2));

      if (current.id !== origin.id) {
        carry_over.push({
          year: current.year,
          month: current.month,
          amount: chunk,
        });
      }

      if (leftover > 0.001) {
        if (!canCarry) {
          throw new Error(
            origin.status === PaymentStatus.OVERDUE
              ? "Mensalista atrasado: o valor extra não vai para o próximo mês"
              : "Valor excede o restante deste mês"
          );
        }

        const next = await this.ensureNextMonth(current);
        currentId = next.id;
      }
    }

    if (leftover > 0.001) {
      throw new Error("Não foi possível aplicar todo o valor nos próximos meses");
    }

    const paymentUpdated = await prismaClient.payment.findFirst({
      where: { id: origin.id },
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

    if (!paymentUpdated) {
      throw new Error("Pagamento não encontrado");
    }

    return {
      ...paymentUpdated,
      remaining: Number(
        (Number(paymentUpdated.amount) - Number(paymentUpdated.paidAmount)).toFixed(2)
      ),
      carry_over,
    };
  }

  private async applyChunk(
    payment: {
      id: string;
      amount: unknown;
      paidAmount: unknown;
      month: number;
      year: number;
      paidAt: Date | null;
      status: PaymentStatus;
      cashFlow: { id: string } | null;
      player: { name: string };
    },
    chunk: number
  ) {
    const nextPaid = Number((Number(payment.paidAmount) + chunk).toFixed(2));
    const totalAmount = Number(payment.amount);
    const isFullyPaid = nextPaid >= totalAmount;
    const cashFlowDescription = `Pagamento ${payment.month}/${payment.year} - ${payment.player.name}`;

    await prismaClient.payment.update({
      where: { id: payment.id },
      data: {
        paidAmount: nextPaid,
        status: isFullyPaid ? PaymentStatus.PAID : payment.status,
        paidAt: isFullyPaid ? new Date() : payment.paidAt,
        cashFlow: payment.cashFlow
          ? {
              update: {
                amount: nextPaid,
                description: cashFlowDescription,
                date: new Date(),
              },
            }
          : {
              create: {
                type: CashFlowType.INCOME,
                amount: nextPaid,
                description: cashFlowDescription,
                date: new Date(),
              },
            },
      },
    });
  }

  private async ensureNextMonth(payment: {
    playerId: string;
    year: number;
    month: number;
    player: {
      id: string;
      name: string;
      type: PlayerType;
      monthlyFee: unknown;
      active: boolean;
    };
  }) {
    const next = nextCompetence(payment.year, payment.month);
    const fee = feeFromPlayer(payment.player);
    const note = `Saldo de ${competenceLabel(payment.month, payment.year)}`;

    const existing = await prismaClient.payment.findFirst({
      where: {
        playerId: payment.playerId,
        year: next.year,
        month: next.month,
      },
      include: { player: true, cashFlow: true },
    });

    if (existing?.status === PaymentStatus.CANCELLED) {
      return prismaClient.payment.update({
        where: { id: existing.id },
        data: {
          status: PaymentStatus.PENDING,
          paidAmount: 0,
          paidAt: null,
          amount: fee,
          notes: note,
        },
        include: { player: true, cashFlow: true },
      });
    }

    if (existing) {
      return existing;
    }

    if (!payment.player.active) {
      throw new Error("Jogador está desativado; não dá para lançar o saldo no próximo mês");
    }

    return prismaClient.payment.create({
      data: {
        playerId: payment.playerId,
        year: next.year,
        month: next.month,
        amount: fee,
        notes: note,
      },
      include: { player: true, cashFlow: true },
    });
  }
}

export { AddPaymentValueService };
