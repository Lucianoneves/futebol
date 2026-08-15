export function nextCompetence(year: number, month: number, extra = 1) {
  const date = new Date(year, month - 1 + extra, 1);

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

export function competenceLabel(month: number, year: number) {
  return `${String(month).padStart(2, "0")}/${year}`;
}

export const OVERDUE_DAY = 21;

export const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function assertIsoDay(value: string) {
  if (!ISO_DAY.test(value)) {
    throw new Error("Data inválida. Use AAAA-MM-DD");
  }

  return value;
}

export function startOfIsoDay(value: string) {
  const date = new Date(`${assertIsoDay(value)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Data inválida");
  }

  return date;
}

export function assertMonth(month: number) {
  if (month < 1 || month > 12) {
    throw new Error("Mês deve ser entre 1 e 12");
  }
}

export function assertYearMonth(
  year: number,
  month: number,
  missingMessage = "Ano e mês são obrigatórios"
) {
  if (!year || !month) {
    throw new Error(missingMessage);
  }

  assertMonth(month);
}

export function monthRange(year: number, month: number) {
  assertMonth(month);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return { start, end };
}

export function parseSpentAt(value?: string, fallback?: Date) {
  const date = value ? new Date(value) : fallback ?? new Date();

  if (Number.isNaN(date.getTime())) {
    throw new Error("Data da despesa inválida");
  }

  return date;
}

export function isoDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatIsoDayBr(value: string) {
  if (ISO_DAY.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  return value;
}

export function dayRange(value: string) {
  const start = startOfIsoDay(value);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export function splitEvenly(total: number, count: number) {
  if (count <= 0) return [];

  const cents = Math.round(Number(total) * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;

  return Array.from({ length: count }, (_, index) =>
    Number(((base + (index < remainder ? 1 : 0)) / 100).toFixed(2))
  );
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function overdueStartsOn(year: number, month: number) {
  const next = nextCompetence(year, month);
  return new Date(next.year, next.month - 1, OVERDUE_DAY);
}

export function isCompetenceOverdue(
  year: number,
  month: number,
  now = new Date()
) {
  return startOfDay(now) >= startOfDay(overdueStartsOn(year, month));
}

export function billingStartsOn(year: number, month: number) {
  const prev = nextCompetence(year, month, -1);
  return new Date(prev.year, prev.month - 1, OVERDUE_DAY);
}

export function isCompetenceBillingOpen(
  year: number,
  month: number,
  now = new Date()
) {
  return startOfDay(now) >= startOfDay(billingStartsOn(year, month));
}
