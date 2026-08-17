import {
  money,
  monthLabel,
  monthName,
  PAYMENT_STATUS_LABEL,
  PLAYER_TYPE_LABEL,
  paymentStatusClass,
  remainingOf,
  sortByPtName,
} from "./format";
import { downloadBlob } from "./exportReport";
import type { MonthlyReport, Payment, PlayerType } from "./types";

export type ReportImageRow = {
  name: string;
  type?: string;
  status?: string;
  value: number | null;
  paidAmount?: number;
  remaining?: number;
};

export type ReportImageData = {
  kind?: "report" | "payments";
  year: number;
  month: number;
  paidTotal: number;
  pendingTotal?: number;
  expectedTotal?: number;
  paidCount: number;
  owingCount: number;
  pendingCount?: number;
  paid: ReportImageRow[];
  owing: ReportImageRow[];
};

const WIDTH = 980;
const PAD = 32;
const CARD_H = 118;
const ROW_H = 42;
const RADIUS = 14;

export function reportFromMonthly(data: MonthlyReport): ReportImageData {
  const paid = toSortedRows(
    data.paid,
    (item) => item.name,
    (item) => ({
      name: item.name,
      type: item.type,
      value: Number(item.paidAmount ?? item.amount ?? 0),
    })
  );
  const owing = toSortedRows(
    data.owing,
    (item) => item.name,
    (item) => ({
      name: item.name,
      type: item.type,
      status: item.status,
      value: item.amount === null ? null : Number(item.amount),
    })
  );

  return {
    kind: "report",
    year: data.year,
    month: data.month,
    paidTotal: data.summary.paidTotal,
    pendingTotal: data.summary.pendingTotal,
    expectedTotal: data.summary.expectedTotal,
    paidCount: data.summary.paidCount,
    owingCount: data.summary.owingCount,
    pendingCount: data.summary.pendingCount,
    paid,
    owing,
  };
}

export function reportFromPayments(
  payments: Payment[],
  year: number,
  month: number
): ReportImageData {
  const active = payments.filter((item) => item.status !== "CANCELLED");
  const monthly = active.filter((item) => item.player?.type === "MONTHLY");
  const casual = active.filter((item) => item.player?.type === "CASUAL");

  const toRow = (item: Payment): ReportImageRow => ({
    name: item.player?.name || "Jogador",
    type: item.player?.type,
    status: item.status,
    value: Number(item.amount || 0),
    paidAmount: Number(item.paidAmount || 0),
    remaining: remainingOf(item),
  });

  const paidTotal = active.reduce(
    (sum, item) => sum + Number(item.paidAmount || 0),
    0
  );
  const expectedTotal = active.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const paidCount = active.filter((item) => item.status === "PAID").length;
  const pendingCount = active.filter((item) => item.status !== "PAID").length;

  return {
    kind: "payments",
    year,
    month,
    paidTotal,
    pendingTotal: Number(Math.max(0, expectedTotal - paidTotal).toFixed(2)),
    expectedTotal,
    paidCount,
    owingCount: pendingCount,
    pendingCount,
    paid: toSortedRows(monthly, (item) => item.player?.name || "", toRow),
    owing: toSortedRows(casual, (item) => item.player?.name || "", toRow),
  };
}

export function reportImageFilename(data: ReportImageData) {
  const prefix = data.kind === "payments" ? "pagamentos" : "relatorio";
  return `${prefix}-${monthLabel(data.month)}-${data.year}.png`;
}

export async function renderReportPng(data: ReportImageData): Promise<Blob> {
  const canvas = drawReportCanvas(data);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar imagem"))),
      "image/png"
    );
  });
}

export async function copyPngToClipboard(blob: Blob) {
  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": blob }),
  ]);
}

export function downloadPng(blob: Blob, filename: string) {
  downloadBlob(blob, filename);
}

async function copyReportImageWithFallback(
  getBlob: () => Promise<Blob>,
  filename: string
) {
  try {
    const blob = await getBlob();
    await copyPngToClipboard(blob);
    return {
      ok: true as const,
      message: "Imagem copiada. Cole no WhatsApp (Ctrl+V).",
    };
  } catch {
    try {
      const blob = await getBlob();
      downloadPng(blob, filename);
      return {
        ok: true as const,
        message:
          "Não deu para copiar. A imagem foi baixada para você anexar no WhatsApp.",
      };
    } catch {
      return {
        ok: false as const,
        message: "Não foi possível gerar a imagem do relatório.",
      };
    }
  }
}

export { copyReportImageWithFallback };

function toSortedRows<T>(
  items: T[],
  getName: (item: T) => string,
  map: (item: T) => ReportImageRow
) {
  return [...items]
    .sort((left, right) => sortByPtName(getName(left), getName(right)))
    .map(map);
}

function drawReportCanvas(data: ReportImageData) {
  const display = fontFamily("--font-barlow", '"Arial Narrow", sans-serif');
  const body = fontFamily("--font-manrope", '"Segoe UI", sans-serif');
  const isPayments = data.kind === "payments";
  const paidSum = data.paid.reduce(
    (sum, item) => sum + Number(item.paidAmount ?? item.value ?? 0),
    0
  );
  const owingSum = data.owing.reduce(
    (sum, item) => sum + Number(item.paidAmount ?? item.value ?? 0),
    0
  );
  const rows = Math.max(data.paid.length, data.owing.length, 1);
  const cardH = isPayments ? 96 : CARD_H;
  const panelTop = PAD + 78 + 16 + cardH + 20;
  const panelH = 56 + 38 + rows * ROW_H + 18;
  const height = panelTop + panelH + PAD;

  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = WIDTH * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.scale(scale, scale);

  const bg = ctx.createLinearGradient(0, 0, WIDTH, height);
  bg.addColorStop(0, "#f4faf5");
  bg.addColorStop(0.45, "#e7f1ea");
  bg.addColorStop(1, "#dce9df");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.fillStyle = "#134829";
  ctx.font = `700 36px ${display}`;
  ctx.fillText(isPayments ? "Pagamentos" : "Relatórios", PAD, PAD + 34);

  ctx.fillStyle = "#4d6556";
  ctx.font = `500 15px ${body}`;
  ctx.fillText(
    isPayments
      ? `${monthLabel(data.month)}/${data.year}`
      : `Quem pagou e quem deve no mês · ${monthName(data.month)}/${data.year}`,
    PAD,
    PAD + 62
  );

  const inner = WIDTH - PAD * 2;
  const gap = 16;
  const cardW = (inner - gap * 2) / 3;
  const pendingCount = data.pendingCount ?? data.owingCount;
  const pendingTotal =
    data.pendingTotal ??
    Number(Math.max(0, (data.expectedTotal ?? 0) - data.paidTotal).toFixed(2));
  const cards = [
    {
      label: "Total arrecadado",
      value: money(data.paidTotal),
      hint: isPayments
        ? undefined
        : data.paidCount === 1
          ? "1 jogador pagou"
          : `${data.paidCount} jogadores pagaram`,
    },
    {
      label: "Pendente",
      value: money(pendingTotal),
      hint: isPayments
        ? undefined
        : pendingCount === 1
          ? "1 jogador falta pagar"
          : `${pendingCount} jogadores faltam pagar`,
    },
    {
      label: "Esperado no mês",
      value: money(data.expectedTotal ?? data.paidTotal + pendingTotal),
    },
  ];

  cards.forEach((card, index) => {
    const x = PAD + index * (cardW + gap);
    const y = PAD + 78;
    drawCard(ctx, x, y, cardW, cardH);
    ctx.fillStyle = "#4d6556";
    ctx.font = `500 14px ${body}`;
    ctx.fillText(card.label, x + 18, y + 28);
    ctx.fillStyle = "#13261a";
    ctx.font = `700 28px ${display}`;
    ctx.fillText(card.value, x + 18, y + 68);
    if (card.hint) {
      ctx.fillStyle = "#4d6556";
      ctx.font = `500 13px ${body}`;
      ctx.fillText(card.hint, x + 18, y + 96);
    }
  });

  const colW = (inner - gap) / 2;
  const leftX = PAD;
  const rightX = PAD + colW + gap;

  drawCard(ctx, leftX, panelTop, colW, panelH);
  drawCard(ctx, rightX, panelTop, colW, panelH);

  ctx.fillStyle = "#13261a";
  ctx.font = `700 20px ${display}`;
  ctx.fillText(
    isPayments
      ? `Mensalistas (${data.paid.length}) · ${money(paidSum)}`
      : `Quem pagou · ${money(paidSum)}`,
    leftX + 20,
    panelTop + 34
  );
  ctx.fillText(
    isPayments
      ? `Convidados (${data.owing.length}) · ${money(owingSum)}`
      : "Quem deve",
    rightX + 20,
    panelTop + 34
  );

  if (isPayments) {
    drawPaymentsColumns(ctx, data, leftX, rightX, panelTop, colW, body);
  } else {
    drawReportColumns(ctx, data, leftX, rightX, panelTop, colW, body);
  }

  return canvas;
}

function drawReportColumns(
  ctx: CanvasRenderingContext2D,
  data: ReportImageData,
  leftX: number,
  rightX: number,
  panelTop: number,
  colW: number,
  body: string
) {
  drawTableHeader(
    ctx,
    leftX,
    panelTop + 48,
    colW,
    ["Jogador", "Tipo", "Valor"],
    [0.46, 0.3, 0.24],
    body
  );
  drawTableHeader(
    ctx,
    rightX,
    panelTop + 48,
    colW,
    ["Jogador", "Status", "Valor"],
    [0.46, 0.3, 0.24],
    body
  );

  if (data.paid.length === 0) {
    drawEmpty(ctx, leftX, panelTop + 86, colW, "Nenhum pagamento confirmado.", body);
  } else {
    data.paid.forEach((item, index) => {
      drawRow(
        ctx,
        leftX,
        panelTop + 86 + index * ROW_H,
        colW,
        [
          item.name,
          PLAYER_TYPE_LABEL[item.type as PlayerType] || item.type || "-",
          money(item.value),
        ],
        [0.46, 0.3, 0.24],
        body,
        item.type === "CASUAL" ? 1 : undefined,
        item.type === "CASUAL" ? "casual" : "muted",
        item.type === "CASUAL"
      );
    });
  }

  if (data.owing.length === 0) {
    drawEmpty(ctx, rightX, panelTop + 86, colW, "Ninguém em aberto.", body);
  } else {
    data.owing.forEach((item, index) => {
      drawRow(
        ctx,
        rightX,
        panelTop + 86 + index * ROW_H,
        colW,
        [
          item.name,
          PAYMENT_STATUS_LABEL[item.status || ""] || item.status || "-",
          item.value === null ? "-" : money(item.value),
        ],
        [0.46, 0.3, 0.24],
        body,
        1,
        paymentStatusClass(item.status || ""),
        item.type === "CASUAL"
      );
    });
  }
}

function drawPaymentsColumns(
  ctx: CanvasRenderingContext2D,
  data: ReportImageData,
  leftX: number,
  rightX: number,
  panelTop: number,
  colW: number,
  body: string
) {
  const headers = ["Jogador", "Status", "Restante"];
  const ratios = [0.46, 0.3, 0.24];

  drawTableHeader(ctx, leftX, panelTop + 48, colW, headers, ratios, body);
  drawTableHeader(ctx, rightX, panelTop + 48, colW, headers, ratios, body);

  const drawPaymentRows = (
    items: ReportImageRow[],
    x: number,
    emptyText: string
  ) => {
    if (items.length === 0) {
      drawEmpty(ctx, x, panelTop + 86, colW, emptyText, body);
      return;
    }
    items.forEach((item, index) => {
      drawRow(
        ctx,
        x,
        panelTop + 86 + index * ROW_H,
        colW,
        [
          item.name,
          PAYMENT_STATUS_LABEL[item.status || ""] || item.status || "-",
          money(item.remaining ?? 0),
        ],
        ratios,
        body,
        1,
        paymentStatusClass(item.status || ""),
        item.type === "CASUAL"
      );
    });
  };

  drawPaymentRows(data.paid, leftX, "Nenhum mensalista.");
  drawPaymentRows(data.owing, rightX, "Nenhum convidado.");
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.shadowColor = "rgba(19, 70, 36, 0.08)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#f7fbf7";
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, RADIUS);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "#c5d6c9";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, RADIUS);
  ctx.stroke();
}

function drawTableHeader(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  labels: string[],
  ratios: number[],
  body: string
) {
  ctx.fillStyle = "#4d6556";
  ctx.font = `600 13px ${body}`;
  let cursor = x + 20;
  labels.forEach((label, index) => {
    const colW = (width - 40) * ratios[index];
    ctx.fillText(label, cursor, y + 22);
    cursor += colW;
  });
  ctx.strokeStyle = "#c5d6c9";
  ctx.beginPath();
  ctx.moveTo(x + 16, y + 34);
  ctx.lineTo(x + width - 16, y + 34);
  ctx.stroke();
}

function drawRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  values: string[],
  ratios: number[],
  body: string,
  badgeIndex?: number,
  tone: "ok" | "warn" | "danger" | "muted" | "casual" = "muted",
  highlight = false
) {
  if (highlight) {
    ctx.fillStyle = "rgba(212, 160, 23, 0.16)";
    ctx.fillRect(x + 10, y + 2, width - 20, ROW_H - 4);
  }
  const inner = width - 40;
  let cursor = x + 20;
  values.forEach((value, index) => {
    const colW = inner * ratios[index];
    if (index === badgeIndex) {
      drawBadge(ctx, cursor, y + 8, value, tone, body);
    } else {
      ctx.fillStyle = highlight ? "#6b4f0e" : "#13261a";
      ctx.font = `500 14px ${body}`;
      ctx.fillText(fitText(ctx, value, colW - 8), cursor, y + 26);
    }
    cursor += colW;
  });
  ctx.strokeStyle = "#c5d6c9";
  ctx.beginPath();
  ctx.moveTo(x + 16, y + ROW_H - 1);
  ctx.lineTo(x + width - 16, y + ROW_H - 1);
  ctx.stroke();
}

function drawEmpty(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _width: number,
  text: string,
  body: string
) {
  ctx.fillStyle = "#4d6556";
  ctx.font = `500 14px ${body}`;
  ctx.fillText(text, x + 20, y + 26);
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  tone: "ok" | "warn" | "danger" | "muted" | "casual",
  body: string
) {
  const colors = {
    ok: { bg: "rgba(29, 122, 69, 0.12)", fg: "#1d7a45" },
    warn: { bg: "rgba(183, 121, 31, 0.14)", fg: "#b7791f" },
    danger: { bg: "rgba(180, 35, 24, 0.12)", fg: "#b42318" },
    muted: { bg: "rgba(77, 101, 86, 0.12)", fg: "#4d6556" },
    casual: { bg: "rgba(212, 160, 23, 0.22)", fg: "#8a6410" },
  }[tone];
  ctx.font = `700 12px ${body}`;
  const w = ctx.measureText(text).width + 16;
  ctx.fillStyle = colors.bg;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 24, 8);
  ctx.fill();
  ctx.fillStyle = colors.fg;
  ctx.fillText(text, x + 8, y + 16);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let value = text;
  while (value.length > 1 && ctx.measureText(`${value}…`).width > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value}…`;
}

function fontFamily(cssVar: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();
  return value ? `${value}, ${fallback}` : fallback;
}

export type ExpensesDayImageData = {
  dayLabel: string;
  caixaTotal: number;
  churrascoRestante: number;
  churrascoPaid: number;
  playerCount: number;
  perPerson: number;
  items: Array<{ name: string; pay: string; amount: number }>;
  shares: Array<{
    name: string;
    type?: string;
    status: string;
    amount: number;
    remaining: number;
  }>;
};

export function expensesDayImageFilename(dayIso: string) {
  return `despesas-${dayIso}.png`;
}

export async function renderExpensesDayPng(
  data: ExpensesDayImageData
): Promise<Blob> {
  const canvas = drawExpensesDayCanvas(data);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar imagem"))),
      "image/png"
    );
  });
}

function drawExpensesDayCanvas(data: ExpensesDayImageData) {
  const display = fontFamily("--font-barlow", '"Arial Narrow", sans-serif');
  const body = fontFamily("--font-manrope", '"Segoe UI", sans-serif');
  const rows = Math.max(data.items.length, data.shares.length, 1);
  const panelTop = PAD + 78 + 16 + CARD_H + 20;
  const panelH = 56 + 38 + rows * ROW_H + 18;
  const height = panelTop + panelH + PAD;

  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = WIDTH * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.scale(scale, scale);

  const bg = ctx.createLinearGradient(0, 0, WIDTH, height);
  bg.addColorStop(0, "#f4faf5");
  bg.addColorStop(0.45, "#e7f1ea");
  bg.addColorStop(1, "#dce9df");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.fillStyle = "#134829";
  ctx.font = `700 36px ${display}`;
  ctx.fillText("Despesas", PAD, PAD + 34);

  ctx.fillStyle = "#4d6556";
  ctx.font = `500 15px ${body}`;
  ctx.fillText(
    data.churrascoPaid > 0
      ? `Pelada de ${data.dayLabel} · já pago ${money(data.churrascoPaid)}`
      : `Pelada de ${data.dayLabel}`,
    PAD,
    PAD + 62
  );

  const inner = WIDTH - PAD * 2;
  const gap = 16;
  const cardW = (inner - gap * 3) / 4;
  const cards = [
    { label: "Sai do caixa", value: money(data.caixaTotal) },
    { label: "Churrasco à parte", value: money(data.churrascoRestante) },
    { label: "Jogadores", value: String(data.playerCount) },
    {
      label: "Por pessoa",
      value: data.perPerson > 0 ? money(data.perPerson) : "—",
    },
  ];

  cards.forEach((card, index) => {
    const x = PAD + index * (cardW + gap);
    const y = PAD + 78;
    drawCard(ctx, x, y, cardW, CARD_H);
    ctx.fillStyle = "#4d6556";
    ctx.font = `500 13px ${body}`;
    ctx.fillText(card.label, x + 16, y + 32);
    ctx.fillStyle = "#13261a";
    ctx.font = `700 26px ${display}`;
    ctx.fillText(card.value, x + 16, y + 72);
  });

  const colW = (inner - gap) / 2;
  const leftX = PAD;
  const rightX = PAD + colW + gap;

  drawCard(ctx, leftX, panelTop, colW, panelH);
  drawCard(ctx, rightX, panelTop, colW, panelH);

  ctx.fillStyle = "#13261a";
  ctx.font = `700 20px ${display}`;
  ctx.fillText("Itens do dia", leftX + 20, panelTop + 34);
  ctx.fillText("Rateio do churrasco", rightX + 20, panelTop + 34);

  drawTableHeader(
    ctx,
    leftX,
    panelTop + 48,
    colW,
    ["Item", "Paga", "Valor"],
    [0.46, 0.3, 0.24],
    body
  );
  drawTableHeader(
    ctx,
    rightX,
    panelTop + 48,
    colW,
    ["Jogador", "Status", "Valor"],
    [0.46, 0.3, 0.24],
    body
  );

  if (data.items.length === 0) {
    drawEmpty(ctx, leftX, panelTop + 86, colW, "Nenhum item neste dia.", body);
  } else {
    data.items.forEach((item, index) => {
      drawRow(
        ctx,
        leftX,
        panelTop + 86 + index * ROW_H,
        colW,
        [item.name, item.pay, money(item.amount)],
        [0.46, 0.3, 0.24],
        body,
        1,
        item.pay === "Rateio" ? "casual" : "ok"
      );
    });
  }

  if (data.shares.length === 0) {
    drawEmpty(
      ctx,
      rightX,
      panelTop + 86,
      colW,
      "Nenhum rateio gerado.",
      body
    );
  } else {
    data.shares.forEach((item, index) => {
      drawRow(
        ctx,
        rightX,
        panelTop + 86 + index * ROW_H,
        colW,
        [
          item.name,
          PAYMENT_STATUS_LABEL[item.status] || item.status,
          money(item.amount),
        ],
        [0.46, 0.3, 0.24],
        body,
        1,
        paymentStatusClass(item.status)
      );
    });
  }

  return canvas;
}

export type PlayersImageData = {
  onlyActive: boolean;
  monthly: Array<{ name: string; fee: number; active: boolean }>;
  casual: Array<{ name: string; fee: number; active: boolean }>;
  fees?: Array<{ name: string; fee: number; active: boolean }>;
};

export function playersImageFilename(onlyActive: boolean) {
  return onlyActive ? "jogadores-ativos.png" : "jogadores-inativos.png";
}

export async function renderPlayersPng(data: PlayersImageData): Promise<Blob> {
  return blobFromCanvas(drawPlayersCanvas(data));
}

function drawPlayersCanvas(data: PlayersImageData) {
  const display = fontFamily("--font-barlow", '"Arial Narrow", sans-serif');
  const body = fontFamily("--font-manrope", '"Segoe UI", sans-serif');
  const fees = data.fees ?? [];
  const rows = Math.max(data.monthly.length, data.casual.length, 1);
  const cardH = 96;
  const panelTop = PAD + 78 + 16 + cardH + 20;
  const panelH = 56 + 38 + rows * ROW_H + 18;
  const feesRows = Math.max(fees.length, 1);
  const feesPanelH = fees.length
    ? 56 + 38 + feesRows * ROW_H + 18
    : 0;
  const feesGap = fees.length ? 16 : 0;
  const { canvas, ctx } = makeCanvas(
    panelTop + panelH + feesGap + feesPanelH + PAD
  );

  ctx.fillStyle = "#134829";
  ctx.font = `700 36px ${display}`;
  ctx.fillText("Jogadores", PAD, PAD + 34);

  ctx.fillStyle = "#4d6556";
  ctx.font = `500 15px ${body}`;
  ctx.fillText(
    data.onlyActive ? "Somente ativos" : "Somente inativos",
    PAD,
    PAD + 62
  );

  const inner = WIDTH - PAD * 2;
  const gap = 16;
  const cardW = (inner - gap * 2) / 3;
  const total = data.monthly.length + data.casual.length + fees.length;
  const cards = [
    { label: "Total", value: String(total) },
    { label: "Mensalistas", value: String(data.monthly.length) },
    { label: "Convidados", value: String(data.casual.length) },
  ];

  cards.forEach((card, index) => {
    const x = PAD + index * (cardW + gap);
    const y = PAD + 78;
    drawCard(ctx, x, y, cardW, cardH);
    ctx.fillStyle = "#4d6556";
    ctx.font = `500 14px ${body}`;
    ctx.fillText(card.label, x + 18, y + 32);
    ctx.fillStyle = "#13261a";
    ctx.font = `700 28px ${display}`;
    ctx.fillText(card.value, x + 18, y + 72);
  });

  const colW = (inner - gap) / 2;
  const leftX = PAD;
  const rightX = PAD + colW + gap;

  drawCard(ctx, leftX, panelTop, colW, panelH);
  drawCard(ctx, rightX, panelTop, colW, panelH);

  ctx.fillStyle = "#13261a";
  ctx.font = `700 20px ${display}`;
  ctx.fillText(`Mensalistas (${data.monthly.length})`, leftX + 20, panelTop + 34);
  ctx.fillText(`Convidados (${data.casual.length})`, rightX + 20, panelTop + 34);

  const headers = ["Jogador", "Taxa", "Status"];
  const ratios = [0.46, 0.3, 0.24];
  drawTableHeader(ctx, leftX, panelTop + 48, colW, headers, ratios, body);
  drawTableHeader(ctx, rightX, panelTop + 48, colW, headers, ratios, body);

  const drawPlayers = (
    items: PlayersImageData["monthly"],
    x: number,
    emptyText: string
  ) => {
    if (items.length === 0) {
      drawEmpty(ctx, x, panelTop + 86, colW, emptyText, body);
      return;
    }
    items.forEach((item, index) => {
      drawRow(
        ctx,
        x,
        panelTop + 86 + index * ROW_H,
        colW,
        [item.name, money(item.fee), item.active ? "Ativo" : "Inativo"],
        ratios,
        body,
        2,
        item.active ? "ok" : "muted"
      );
    });
  };

  drawPlayers(data.monthly, leftX, "Nenhum mensalista encontrado.");
  drawPlayers(data.casual, rightX, "Nenhum convidado encontrado.");

  if (fees.length > 0) {
    const feesTop = panelTop + panelH + 16;
    drawCard(ctx, PAD, feesTop, inner, feesPanelH);
    ctx.fillStyle = "#13261a";
    ctx.font = `700 20px ${display}`;
    ctx.fillText(`Sem taxa (${fees.length})`, PAD + 20, feesTop + 34);
    drawTableHeader(ctx, PAD, feesTop + 48, inner, headers, ratios, body);
    fees.forEach((item, index) => {
      drawRow(
        ctx,
        PAD,
        feesTop + 86 + index * ROW_H,
        inner,
        [item.name, "Sem cobrança", item.active ? "Ativo" : "Inativo"],
        ratios,
        body,
        2,
        item.active ? "ok" : "muted"
      );
    });
  }

  return canvas;
}

function makeCanvas(height: number) {
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = WIDTH * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.scale(scale, scale);

  const bg = ctx.createLinearGradient(0, 0, WIDTH, height);
  bg.addColorStop(0, "#f4faf5");
  bg.addColorStop(0.45, "#e7f1ea");
  bg.addColorStop(1, "#dce9df");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, height);

  return { canvas, ctx };
}

function blobFromCanvas(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Falha ao gerar imagem")),
      "image/png"
    );
  });
}
