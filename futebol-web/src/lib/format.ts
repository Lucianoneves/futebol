export function money(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

export function toDateInputValue(value?: string | Date) {
  const date = value ? new Date(value) : new Date();
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;

  return `${safe.getFullYear()}-${padDatePart(safe.getMonth() + 1)}-${padDatePart(safe.getDate())}`;
}

export function toApiDate(value: string) {
  return `${value}T12:00:00`;
}

export function formatDateBr(value: string) {
  const iso = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return `${iso[3]}/${iso[2]}/${iso[1]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function maskBrDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function parseBrDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
}

export function monthLabel(month: number) {
  return padDatePart(month);
}

export function currentYearMonth(now = new Date()) {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

export function isMonthBillingOpen(
  year: number,
  month: number,
  overdueDay = 21,
  now = new Date()
) {
  const opensOn = new Date(year, month - 2, overdueDay);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return today >= new Date(opensOn.getFullYear(), opensOn.getMonth(), opensOn.getDate());
}

export function visibleHistoryPayment<
  T extends { status: string; paidAmount?: string | number | null }
>(
  payment: T | null | undefined,
  year: number,
  month: number,
  overdueDay = 21,
  now = new Date()
) {
  if (!payment) return null;

  const unpaidPending =
    payment.status === "PENDING" && Number(payment.paidAmount || 0) <= 0;

  if (unpaidPending && !isMonthBillingOpen(year, month, overdueDay, now)) {
    return null;
  }

  return payment;
}

export function remainingOf(payment: {
  amount?: string | number | null;
  paidAmount?: string | number | null;
  remaining?: number;
}) {
  if (typeof payment.remaining === "number") return payment.remaining;
  return Number(payment.amount || 0) - Number(payment.paidAmount || 0);
}

export function sortByPtName(left: string, right: string) {
  return left.localeCompare(right, "pt-BR", { sensitivity: "base" });
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesNameSearch(name: string, query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return normalizeSearch(name).includes(normalized);
}

export function filterSortByName<T>(
  items: T[],
  query: string,
  getName: (item: T) => string
) {
  return items
    .filter((item) => matchesNameSearch(getName(item), query))
    .sort((left, right) => sortByPtName(getName(left), getName(right)));
}

export function partitionByPlayerType<T>(
  items: T[],
  getType: (item: T) => string | undefined
) {
  return {
    monthly: items.filter((item) => getType(item) === "MONTHLY"),
    casual: items.filter((item) => getType(item) === "CASUAL"),
    fees: items.filter((item) => getType(item) === "FEES"),
  };
}

export const NAME_SEARCH_PLACEHOLDER = "Ney, Duda, Pedro...";

export const SITUATION_LABEL: Record<string, string> = {
  PAID: "Em dia",
  PENDING: "Em aberto",
  OVERDUE: "Atrasado",
};

export function paymentStatusClass(
  status: string
): "ok" | "warn" | "danger" | "muted" {
  if (status === "PAID") return "ok";
  if (status === "OVERDUE") return "danger";
  if (status === "PENDING") return "warn";
  return "muted";
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  OVERDUE: "Atrasado",
  CANCELLED: "Cancelado",
  MISSING: "Sem cobrança",
};

export const PLAYER_TYPE_LABEL: Record<string, string> = {
  MONTHLY: "Mensalista",
  CASUAL: "Convidado",
  FEES: "Sem taxa",
};

export const STAT_CARD_HINT = {
  collected: "O que já entrou neste mês",
  pending: "Ainda falta receber das cobranças",
  expected: "Valor cobrado no mês. Pagar agora não altera este número.",
} as const;

export function playerFeeAmount(player: {
  type: string;
  monthlyFee?: string | number | null;
  casualFee?: string | number | null;
}) {
  if (player.type === "FEES") return 0;
  if (player.type === "MONTHLY") return Number(player.monthlyFee || 0);
  return Number(player.casualFee || 0);
}

export function playerTypeClass(type: string) {
  if (type === "CASUAL") return "casual";
  if (type === "FEES") return "muted";
  return "monthly";
}

export function transactionTypeLabel(type: string) {
  if (type === "INCOME") return "Receita";
  if (type === "PREPAID") return "Adiantado";
  return "Despesa";
}

export function transactionTypeClass(type: string) {
  if (type === "INCOME") return "ok";
  if (type === "PREPAID") return "casual";
  return "danger";
}

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function monthName(month: number) {
  return MONTH_NAMES[month - 1] || String(month);
}
