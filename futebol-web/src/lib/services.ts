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
  Session,
  WhatsAppImportResult,
  GenerateMonthlyPaymentsResult,
} from "./types";

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
  }) => {
    const search = new URLSearchParams();
    if (params?.player_id) search.set("player_id", params.player_id);
    if (params?.year) search.set("year", String(params.year));
    if (params?.month) search.set("month", String(params.month));
    if (params?.status) search.set("status", params.status);
    const query = search.toString();
    return api<Payment[]>(`/payments${query ? `?${query}` : ""}`);
  },
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
  list: (expense_type_id?: string) => {
    const query = expense_type_id
      ? `?expense_type_id=${expense_type_id}`
      : "";
    return api<Expense[]>(`/expenses${query}`);
  },
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

export const dashboardApi = {
  balance: (year?: number, month?: number) => {
    const search = new URLSearchParams();
    if (year) search.set("year", String(year));
    if (month) search.set("month", String(month));
    const query = search.toString();
    return api<BalanceDashboard>(
      `/dashboard/balance${query ? `?${query}` : ""}`
    );
  },
};
