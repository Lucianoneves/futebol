import prismaClient from "../../prisma";
import { PlayerType } from "../../generated/prisma/enums";
import { CreatePaymentService } from "./CreatePaymentService";

interface GenerateMonthlyPaymentsRequest {
  year: number;
  month: number;
}

class GenerateMonthlyPaymentsService {
  async execute({ year, month }: GenerateMonthlyPaymentsRequest) {
    if (!year || !month || month < 1 || month > 12) {
      throw new Error("Informe o mês e o ano da cobrança");
    }

    const players = await prismaClient.player.findMany({
      where: {
        active: true,
        type: PlayerType.MONTHLY,
      },
      orderBy: { name: "asc" },
    });

    if (players.length === 0) {
      throw new Error("Nenhum mensalista ativo para gerar cobrança");
    }

    const createPaymentService = new CreatePaymentService();
    let created = 0;
    let existing = 0;
    let skipped_paid = 0;

    for (const player of players) {
      try {
        const payment = await createPaymentService.execute({
          player_id: player.id,
          year,
          month,
        });

        if ("already_existed" in payment && payment.already_existed) {
          existing += 1;
        } else {
          created += 1;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (message.includes("já quitou")) {
          skipped_paid += 1;
          continue;
        }
        throw err;
      }
    }

    return {
      year,
      month,
      total_players: players.length,
      created,
      existing,
      skipped_paid,
    };
  }
}

export { GenerateMonthlyPaymentsService };
