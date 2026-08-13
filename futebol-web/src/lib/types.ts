export type Role = "ADMIN" | "USER" | "PLAYER";
export type PlayerType = "MONTHLY" | "CASUAL";
export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "MISSING";

export type Session = {
  id: string;
  name: string;
  email: string;
  role: Role;
  playerId?: string | null;
  token: string;
};

export type Player = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: PlayerType;
  monthlyFee: string | number | null;
  casualFee: string | number | null;
  active: boolean;
  hasAccess?: boolean;
  accessEmail?: string | null;
};

export type WhatsAppImportRow = {
  name: string;
  type: PlayerType;
  amount: number | null;
  paid: boolean;
  notes: string | null;
  raw: string;
  player_id: string | null;
  player_action: "create_player" | "existing_player" | "reactivate_player";
  payment_action:
    | "none"
    | "create_pending"
    | "mark_paid"
    | "already_paid"
    | "pay_months";
  months_to_pay: number;
};

export type WhatsAppImportResult = {
  apply: boolean;
  year: number;
  month: number;
  total: number;
  rows: WhatsAppImportRow[];
  summary: {
    create_player: number;
    existing_player: number;
    reactivate_player: number;
    mark_paid: number;
    pending: number;
  };
};

export type Payment = {
  id: string;
  playerId: string;
  year: number;
  month: number;
  amount: string | number;
  paidAmount: string | number;
  status: PaymentStatus;
  paidAt: string | null;
  notes: string | null;
  remaining?: number;
  already_existed?: boolean;
  carry_over?: Array<{ year: number; month: number; amount: number }>;
  player?: {
    id: string;
    name: string;
    type: PlayerType;
  };
};

export type GenerateMonthlyPaymentsResult = {
  year: number;
  month: number;
  total_players: number;
  created: number;
  existing: number;
  skipped_paid: number;
};

export type ExpenseType = {
  id: string;
  name: string;
  active: boolean;
};

export type Expense = {
  id: string;
  description: string;
  expenseTypeId: string;
  amount: string | number;
  spentAt: string;
  expenseType?: ExpenseType;
};

export type MatchPlayer = {
  id: string;
  matchId: string;
  playerId: string;
  player?: {
    id: string;
    name: string;
    type: PlayerType;
  };
};

export type MatchShare = {
  id: string;
  matchId: string;
  playerId: string;
  amount: string | number;
  paidAmount: string | number;
  status: PaymentStatus;
  paidAt: string | null;
  remaining?: number;
  player?: {
    id: string;
    name: string;
    type: PlayerType;
  };
};

export type Match = {
  id: string;
  playedOn: string;
  notes: string | null;
  players: MatchPlayer[];
  shares: MatchShare[];
  total?: number;
  player_count?: number;
  already_existed?: boolean;
};

export type FeeSetting = {
  id: string;
  type: PlayerType;
  amount: number;
  updatedAt: string;
};

export type BalanceDashboard = {
  filter: { year: number | null; month: number | null };
  income: number;
  outcome: number;
  prepaid?: number;
  monthBalance?: number;
  remaining?: number;
  balance: number;
  transactions: Array<{
    id: string;
    type: "INCOME" | "OUTCOME" | "PREPAID";
    amount: number;
    description: string;
    date: string;
  }>;
};

export type MonthlyReport = {
  year: number;
  month: number;
  summary: {
    totalPlayers: number;
    paidCount: number;
    owingCount: number;
    paidTotal: number;
  };
  paid: Array<{
    player_id: string;
    name: string;
    type: PlayerType;
    payment_id: string | null;
    amount: number | null;
    paidAmount?: number;
    status: PaymentStatus;
    paidAt: string | null;
  }>;
  owing: Array<{
    player_id: string;
    name: string;
    type: PlayerType;
    payment_id: string | null;
    amount: number | null;
    paidAmount?: number;
    status: PaymentStatus;
    paidAt: string | null;
  }>;
};

export type PlayerYearHistory = {
  player: {
    id: string;
    name: string;
    type: PlayerType;
    active: boolean;
  };
  year: number;
  overdue_day: number;
  months: Array<{
    month: number;
    payment: {
      id: string;
      amount: number;
      paidAmount: number;
      remaining: number;
      status: PaymentStatus;
      paidAt: string | null;
    } | null;
  }>;
};

export type PlayerSituation = "PAID" | "PENDING" | "OVERDUE";

export type PlayerShareItem = {
  id: string;
  matchId?: string;
  playedOn: string;
  amount: number;
  paidAmount: number;
  status: PaymentStatus;
  paidAt: string | null;
  remaining?: number;
};

export type PlayerStatus = {
  player: {
    id: string;
    name: string;
    type: PlayerType;
    active: boolean;
  };
  year: number;
  month: number;
  overdue_day: number;
  situation: PlayerSituation;
  payment: PlayerYearHistory["months"][number]["payment"];
  months: PlayerYearHistory["months"];
  month_shares: PlayerShareItem[];
  open_shares: PlayerShareItem[];
};
