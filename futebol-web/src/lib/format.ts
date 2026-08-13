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
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

export function monthLabel(month: number) {
  return padDatePart(month);
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

export function paymentStatusClass(status: string) {
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
};

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
