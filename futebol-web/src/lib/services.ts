import { api, ApiError } from "./api";
import type {
  BalanceDashboard,
  Expense,
  ExpenseType,
  FeeSetting,
  MonthlyReport,
  Payment,
  Player,
  PlayerType,
  PlayerYearHistory,
  Session,
  WhatsAppImportResult,
  GenerateMonthlyPaymentsResult,
  Match,
  MatchShare,
  PlayerStatus,
  PlayerShareItem,
} from "./types";

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const authApi = {
  login: (email: string, password: string) =>
    api<Session>("/session", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),
};

export const playersApi = {
  list: (active?: boolean) => {
    const query =
      active === undefined ? "" : `?active=${active ? "true" : "false"}`;
    return api<Player[]>(`/players${query}`);
  },
  create: (data: {
    name: string;
    type: PlayerType;
    email?: string;
    phone?: string;
  }) => api<Player>("/players", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      name: string;
      type: PlayerType;
      email: string;
      phone: string;
      monthlyFee: number;
      casualFee: number;
    }>
  ) => api<Player>(`/players/${id}`, { method: "PUT", body: data }),
  deactivate: (id: string) =>
    api<Player>(`/players/${id}`, { method: "DELETE" }),
  history: (id: string, year: number) =>
    api<PlayerYearHistory>(`/players/${id}/history?year=${year}`),
  grantAccess: (id: string, data: { email: string; password: string }) =>
    api<{ id: string; email: string; role: string; playerId: string | null }>(
      `/players/${id}/access`,
      { method: "POST", body: data }
    ),
  importWhatsApp: (data: {
    text: string;
    year: number;
    month: number;
    apply?: boolean;
  }) =>
    api<WhatsAppImportResult>("/imports/whatsapp", {
      method: "POST",
      body: data,
    }),
};

export const paymentsApi = {
  list: (params?: {
    player_id?: string;
    year?: number;
    month?: number;
    status?: string;
  }) => api<Payment[]>(`/payments${toQuery(params ?? {})}`),
  create: (data: {
    player_id: string;
    year: number;
    month: number;
    amount?: number;
    paid_amount?: number;
    notes?: string;
  }) => api<Payment>("/payments", { method: "POST", body: data }),
  update: (id: string, data: { amount?: number; notes?: string }) =>
    api<Payment>(`/payments/${id}`, { method: "PUT", body: data }),
  addValue: (id: string, value: number) =>
    api<Payment>(`/payments/${id}/add`, { method: "PATCH", body: { value } }),
  markPaid: (id: string) =>
    api<Payment>(`/payments/${id}/paid`, { method: "PATCH" }),
  markOverdue: (id: string) =>
    api<Payment>(`/payments/${id}/overdue`, { method: "PATCH" }),
  cancel: (id: string) =>
    api<Payment>(`/payments/${id}/cancel`, { method: "PATCH" }),
  generateMonth: (year: number, month: number) =>
    api<GenerateMonthlyPaymentsResult>("/payments/generate-month", {
      method: "POST",
      body: { year, month },
    }),
};

export const expensesApi = {
  list: (params?: {
    expense_type_id?: string;
    spentAt?: string;
    year?: number;
    month?: number;
  }) => api<Expense[]>(`/expenses${toQuery(params ?? {})}`),
  create: (data: {
    expense_type_id: string;
    amount: number;
    spentAt?: string;
  }) => api<Expense>("/expenses", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      expense_type_id: string;
      amount: number;
      spentAt: string;
    }>
  ) => api<Expense>(`/expenses/${id}`, { method: "PUT", body: data }),
  remove: (id: string) =>
    api<{ message: string }>(`/expenses/${id}`, { method: "DELETE" }),
};

export const expenseTypesApi = {
  list: () => api<ExpenseType[]>("/expense-types"),
  create: (name: string) =>
    api<ExpenseType>("/expense-types", { method: "POST", body: { name } }),
};

export const feesApi = {
  list: () => api<FeeSetting[]>("/fees"),
  update: (type: PlayerType, amount: number) =>
    api<FeeSetting>("/fees", { method: "PUT", body: { type, amount } }),
};

export const reportsApi = {
  monthly: (year: number, month: number) =>
    api<MonthlyReport>(`/reports/monthly?year=${year}&month=${month}`),
  share: (year: number, month: number) =>
    api<{ year: number; month: number; token: string }>(
      `/reports/share?year=${year}&month=${month}`
    ),
  publicMonthly: async (year: number, month: number, token: string) => {
    const response = await fetch(
      `/api/public-report?year=${year}&month=${month}&token=${encodeURIComponent(token)}`
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(
        data.error || data.message || "Erro na requisição",
        response.status
      );
    }
    return data as MonthlyReport;
  },
};

export const matchesApi = {
  list: (playedOn?: string) => {
    const query = playedOn ? `?playedOn=${playedOn}` : "";
    return api<Match[]>(`/matches${query}`);
  },
  upsert: (data: {
    playedOn: string;
    player_ids: string[];
    notes?: string;
  }) => api<Match>("/matches", { method: "POST", body: data }),
  generateShares: (id: string) =>
    api<Match>(`/matches/${id}/shares`, { method: "POST" }),
  markSharePaid: (id: string) =>
    api<MatchShare>(`/match-shares/${id}/paid`, { method: "PATCH" }),
  cancelShare: (id: string) =>
    api<MatchShare>(`/match-shares/${id}/cancel`, { method: "PATCH" }),
};

export const meApi = {
  status: (year?: number, month?: number) =>
    api<PlayerStatus>(`/me/status${toQuery({ year, month })}`),
  shares: () => api<PlayerShareItem[]>("/me/shares"),
};

export const dashboardApi = {
  balance: (year?: number, month?: number) =>
    api<BalanceDashboard>(`/dashboard/balance${toQuery({ year, month })}`),
};
