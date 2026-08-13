import { monthName } from "./format";

export type ReportShare = {
  year: number;
  month: number;
  token: string;
};

export function publicReportUrl(year: number, month: number, token: string) {
  const origin = (
    process.env.NEXT_PUBLIC_APP_URL || window.location.origin
  ).replace(/\/$/, "");

  return `${origin}/r/${year}/${month}?t=${encodeURIComponent(token)}`;
}

export function whatsAppReportLinkText(
  year: number,
  month: number,
  url: string
) {
  return `Relatório ${monthName(month)}/${year}\n\nAbra para ver quem pagou e quem deve:\n${url}`;
}

export function isLocalShareUrl(url: string) {
  return /localhost|127\.0\.0\.1/.test(url);
}

export function openWhatsApp(text: string) {
  window.open(
    `https://wa.me/?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer"
  );
}
