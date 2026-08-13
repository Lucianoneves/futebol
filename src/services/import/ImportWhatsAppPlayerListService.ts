import prismaClient from "../../prisma";
import { PaymentStatus } from "../../generated/prisma/enums";
import { resolvePlayerFees, feeFromPlayer, DEFAULT_FEES } from "../player/playerFees";
import { nextCompetence } from "../../utils/date";
import { MarkPaymentPaidService } from "../payment/MarkPaymentPaidService";
import {
  normalizePlayerName,
  parseWhatsAppPlayerList,
  type ParsedWhatsAppPlayer,
} from "./parseWhatsAppPlayerList";

interface ImportWhatsAppPlayerListRequest {
  text: string;
  year: number;
  month: number;
  apply?: boolean;
}

type ImportAction =
  | "create_player"
  | "existing_player"
  | "reactivate_player";

type PaymentAction =
  | "none"
  | "create_pending"
  | "mark_paid"
  | "already_paid"
  | "pay_months";

export type WhatsAppImportRow = ParsedWhatsAppPlayer & {
  player_id: string | null;
  player_action: ImportAction;
  payment_action: PaymentAction;
  months_to_pay: number;
};

class ImportWhatsAppPlayerListService {
  async execute({
    text,
    year,
    month,
    apply = false,
  }: ImportWhatsAppPlayerListRequest) {
    if (!text?.trim()) {
      throw new Error("Cole a lista do WhatsApp");
    }

    if (!year || !month || month < 1 || month > 12) {
      throw new Error("Informe o mês e o ano da lista");
    }

    const parsed = parseWhatsAppPlayerList(text);

    if (parsed.length === 0) {
      throw new Error("Nenhum jogador encontrado na lista");
    }

    const players = await prismaClient.player.findMany();
    const byName = new Map(
      players.map((player) => [normalizePlayerName(player.name), player])
    );

    const rows: WhatsAppImportRow[] = parsed.map((item) => {
      const existing = byName.get(normalizePlayerName(item.name));
      const type = existing?.type || item.type;
      const fee = existing
        ? feeFromPlayer(existing)
        : DEFAULT_FEES[item.type];
      const paidTotal = item.amount ?? fee;
      const monthsToPay =
        item.paid && fee > 0
          ? Math.max(1, Math.floor((paidTotal + 0.001) / fee))
          : 0;

      let player_action: ImportAction = "create_player";
      if (existing?.active) player_action = "existing_player";
      if (existing && !existing.active) player_action = "reactivate_player";

      let payment_action: PaymentAction = "create_pending";
      if (item.paid) {
        payment_action = monthsToPay > 1 ? "pay_months" : "mark_paid";
      }

      return {
        ...item,
        type,
        player_id: existing?.id || null,
        player_action,
        payment_action,
        months_to_pay: monthsToPay || 1,
      };
    });

    if (!apply) {
      return {
        apply: false,
        year,
        month,
        total: rows.length,
        rows,
        summary: summarize(rows),
      };
    }

    const markPaid = new MarkPaymentPaidService();
    const applied: WhatsAppImportRow[] = [];

    for (const row of rows) {
      const existing = byName.get(normalizePlayerName(row.name));
      let player = existing;

      if (!player) {
        const fees = await resolvePlayerFees(row.type);
        player = await prismaClient.player.create({
          data: {
            name: row.name,
            type: row.type,
            ...fees,
          },
        });
        byName.set(normalizePlayerName(player.name), player);
      } else if (!player.active) {
        player = await prismaClient.player.update({
          where: { id: player.id },
          data: { active: true },
        });
        byName.set(normalizePlayerName(player.name), player);
      }

      const fee = feeFromPlayer(player);

      const monthsToPay = row.paid
        ? Math.max(1, Math.floor(((row.amount ?? fee) + 0.001) / (fee || 1)))
        : 1;

      let paymentAction: PaymentAction = row.paid ? "mark_paid" : "create_pending";
      let newlyPaid = 0;

      for (let index = 0; index < monthsToPay; index += 1) {
        const target = nextCompetence(year, month, index);
        const payment = await ensurePayment({
          playerId: player.id,
          year: target.year,
          month: target.month,
          amount: fee,
          notes: row.notes,
        });

        if (!row.paid) {
          paymentAction = "create_pending";
          break;
        }

        if (payment.status === PaymentStatus.CANCELLED) {
          continue;
        }

        if (payment.status === PaymentStatus.PAID) {
          continue;
        }

        await markPaid.execute({ payment_id: payment.id });
        newlyPaid += 1;
      }

      if (row.paid && newlyPaid === 0) {
        paymentAction = "already_paid";
      } else if (row.paid && monthsToPay > 1) {
        paymentAction = "pay_months";
      } else if (row.paid) {
        paymentAction = "mark_paid";
      }

      applied.push({
        ...row,
        player_id: player.id,
        months_to_pay: monthsToPay,
        payment_action: paymentAction,
      });
    }

    return {
      apply: true,
      year,
      month,
      total: applied.length,
      rows: applied,
      summary: summarize(applied),
    };
  }
}

function summarize(rows: WhatsAppImportRow[]) {
  return {
    create_player: rows.filter((row) => row.player_action === "create_player")
      .length,
    existing_player: rows.filter(
      (row) => row.player_action === "existing_player"
    ).length,
    reactivate_player: rows.filter(
      (row) => row.player_action === "reactivate_player"
    ).length,
    mark_paid: rows.filter(
      (row) =>
        row.payment_action === "mark_paid" || row.payment_action === "pay_months"
    ).length,
    pending: rows.filter((row) => row.payment_action === "create_pending")
      .length,
  };
}

async function ensurePayment({
  playerId,
  year,
  month,
  amount,
  notes,
}: {
  playerId: string;
  year: number;
  month: number;
  amount: number;
  notes: string | null;
}) {
  const existing = await prismaClient.payment.findFirst({
    where: { playerId, year, month },
  });

  if (existing) {
    return existing;
  }

  return prismaClient.payment.create({
    data: {
      playerId,
      year,
      month,
      amount,
      notes: notes || "Importado do WhatsApp",
    },
  });
}

export { ImportWhatsAppPlayerListService };
