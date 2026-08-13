export const playerNameSelect = {
  id: true,
  name: true,
  type: true,
} as const;

export const paymentPlayerInclude = {
  player: {
    select: playerNameSelect,
  },
} as const;

export function byName(
  left: { name?: string | null },
  right: { name?: string | null }
) {
  return (left.name || "").localeCompare(right.name || "", "pt-BR", {
    sensitivity: "base",
  });
}

export const matchInclude = {
  players: {
    include: {
      player: {
        select: playerNameSelect,
      },
    },
  },
  shares: {
    include: {
      player: {
        select: playerNameSelect,
      },
    },
  },
};

function byPlayerName(
  left: { player?: { name: string } | null },
  right: { player?: { name: string } | null }
) {
  return byName(left.player, right.player);
}

export function withRemaining<T extends { amount: unknown; paidAmount: unknown }>(
  item: T
) {
  return {
    ...item,
    remaining: Number(
      (Number(item.amount) - Number(item.paidAmount || 0)).toFixed(2)
    ),
  };
}

export function presentMatch<
  T extends {
    players: Array<{ player?: { name: string } | null }>;
    shares: Array<{
      amount: unknown;
      paidAmount: unknown;
      player?: { name: string } | null;
    }>;
  },
>(match: T) {
  return {
    ...match,
    players: [...match.players].sort(byPlayerName),
    shares: [...match.shares].sort(byPlayerName).map(withRemaining),
  };
}
