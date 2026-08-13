import { monthName } from "./format";
import { reportsApi } from "./services";

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

export function shareSuccessMessage(url: string, copied: boolean) {
  const local = isLocalShareUrl(url)
    ? " No celular do grupo, publique o painel ou abra pelo IP da rede — localhost não abre fora deste computador."
    : "";
  return copied
    ? `Link copiado.${local}`
    : `WhatsApp aberto com o link.${local}`;
}

export async function resolvePublicReportUrl(year: number, month: number) {
  const share = await reportsApi.share(year, month);
  return publicReportUrl(share.year, share.month, share.token);
}

export async function copyPublicReportLink(year: number, month: number) {
  const url = await resolvePublicReportUrl(year, month);
  await navigator.clipboard.writeText(url);
  return shareSuccessMessage(url, true);
}

export async function sendPublicReportWhatsApp(year: number, month: number) {
  const url = await resolvePublicReportUrl(year, month);
  openWhatsApp(whatsAppReportLinkText(year, month, url));
  return shareSuccessMessage(url, false);
}
