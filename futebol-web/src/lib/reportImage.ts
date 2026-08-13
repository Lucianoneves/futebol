import {
  money,
  monthName,
  PAYMENT_STATUS_LABEL,
  PLAYER_TYPE_LABEL,
  paymentStatusClass,
  sortByPtName,
} from "./format";
import { downloadBlob, exportFilename } from "./exportReport";
import type { MonthlyReport, Payment, PlayerType } from "./types";

export type ReportImageRow = {
  name: string;
  type?: string;
  status?: string;
  value: number | null;
};

export type ReportImageData = {
  year: number;
  month: number;
  paidTotal: number;
  paidCount: number;
  owingCount: number;
  paid: ReportImageRow[];
  owing: ReportImageRow[];
};

const WIDTH = 980;
const PAD = 32;
const CARD_H = 96;
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
    year: data.year,
    month: data.month,
    paidTotal: data.summary.paidTotal,
    paidCount: data.summary.paidCount,
    owingCount: data.summary.owingCount,
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
  const paid = toSortedRows(
    active.filter((item) => item.status === "PAID"),
    (item) => item.player?.name || "",
    (item) => ({
      name: item.player?.name || "Jogador",
      type: item.player?.type,
      value: Number(item.paidAmount || 0),
    })
  );
  const owing = toSortedRows(
    active.filter((item) => item.status !== "PAID"),
    (item) => item.player?.name || "",
    (item) => ({
      name: item.player?.name || "Jogador",
      type: item.player?.type,
      status: item.status,
      value: Number(item.amount || 0),
    })
  );
  const paidTotal = active.reduce(
    (sum, item) => sum + Number(item.paidAmount || 0),
    0
  );

  return {
    year,
    month,
    paidTotal,
    paidCount: paid.length,
    owingCount: owing.length,
    paid,
    owing,
  };
}

export function reportImageFilename(data: ReportImageData) {
  return exportFilename(data.year, data.month, "png");
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
  const paidSum = data.paid.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const rows = Math.max(data.paid.length, data.owing.length, 1);
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
  ctx.fillText("Relatórios", PAD, PAD + 34);

  ctx.fillStyle = "#4d6556";
  ctx.font = `500 15px ${body}`;
  ctx.fillText(
    `Quem pagou e quem deve no mês · ${monthName(data.month)}/${data.year}`,
    PAD,
    PAD + 62
  );

  const inner = WIDTH - PAD * 2;
  const gap = 16;
  const cardW = (inner - gap * 2) / 3;
  const cards = [
    { label: "Total pago no mês", value: money(data.paidTotal) },
    { label: "Em dia", value: String(data.paidCount) },
    { label: "Em aberto", value: String(data.owingCount) },
  ];

  cards.forEach((card, index) => {
    const x = PAD + index * (cardW + gap);
    const y = PAD + 78;
    drawCard(ctx, x, y, cardW, CARD_H);
    ctx.fillStyle = "#4d6556";
    ctx.font = `500 14px ${body}`;
    ctx.fillText(card.label, x + 18, y + 32);
    ctx.fillStyle = "#13261a";
    ctx.font = `700 30px ${display}`;
    ctx.fillText(card.value, x + 18, y + 72);
  });

  const colW = (inner - gap) / 2;
  const leftX = PAD;
  const rightX = PAD + colW + gap;

  drawCard(ctx, leftX, panelTop, colW, panelH);
  drawCard(ctx, rightX, panelTop, colW, panelH);

  ctx.fillStyle = "#13261a";
  ctx.font = `700 20px ${display}`;
  ctx.fillText(`Quem pagou · ${money(paidSum)}`, leftX + 20, panelTop + 34);
  ctx.fillText("Quem deve", rightX + 20, panelTop + 34);

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

  return canvas;
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
