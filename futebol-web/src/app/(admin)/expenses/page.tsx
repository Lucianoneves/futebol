"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  expensesApi,
  expenseTypesApi,
  matchesApi,
  playersApi,
} from "@/lib/services";
import {
  formatDateBr,
  money,
  PAYMENT_STATUS_LABEL,
  paymentStatusClass,
  PLAYER_TYPE_LABEL,
  playerTypeClass,
  remainingOf,
  toApiDate,
  toDateInputValue,
  filterSortByName,
  partitionByPlayerType,
} from "@/lib/format";
import type { Expense, Player } from "@/lib/types";
import { ApiError } from "@/lib/api";

function emptyForm(spentAt = toDateInputValue()) {
  return {
    expense_type_id: "",
    amount: "",
    spentAt,
  };
}

export default function ExpensesPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [day, setDay] = useState(toDateInputValue());
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const { data: expenseTypes = [] } = useQuery({
    queryKey: ["expense-types"],
    queryFn: expenseTypesApi.list,
  });

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", day],
    queryFn: () => expensesApi.list({ spentAt: day }),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players", true],
    queryFn: () => playersApi.list(true),
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["matches", day],
    queryFn: () => matchesApi.list(day),
  });

  const match = matches[0] || null;
  const savedAttendanceKey = [...(match?.players || [])]
    .map((item) => item.playerId)
    .sort()
    .join(",");

  const total = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  );

  const activeShares = useMemo(
    () =>
      (match?.shares || []).filter((share) => share.status !== "CANCELLED"),
    [match]
  );

  const hasPaidShare = activeShares.some((share) => share.status === "PAID");
  const playerCount = selectedIds.length;
  const sharePreview =
    playerCount > 0 ? Number((total / playerCount).toFixed(2)) : 0;

  const staleRateio = useMemo(() => {
    if (activeShares.length === 0) return false;
    const sharePlayers = activeShares
      .map((share) => share.playerId)
      .sort()
      .join();
    const selected = [...selectedIds].sort().join();
    const shareTotal = Number(
      activeShares
        .reduce((sum, share) => sum + Number(share.amount || 0), 0)
        .toFixed(2)
    );
    return sharePlayers !== selected || Math.abs(shareTotal - total) > 0.009;
  }, [activeShares, selectedIds, total]);

  const { monthly, casual } = useMemo(() => {
    const sorted = filterSortByName(players, playerSearch, (player) => player.name);
    return partitionByPlayerType(sorted, (player) => player.type);
  }, [players, playerSearch]);

  useEffect(() => {
    if (!form.expense_type_id && expenseTypes[0]) {
      setForm((prev) => ({ ...prev, expense_type_id: expenseTypes[0].id }));
    }
  }, [expenseTypes, form.expense_type_id]);

  useEffect(() => {
    if (!editing) {
      setForm((prev) => ({ ...prev, spentAt: day }));
    }
  }, [day, editing]);

  useEffect(() => {
    setSelectedIds(
      savedAttendanceKey ? savedAttendanceKey.split(",") : []
    );
  }, [day, savedAttendanceKey]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        expense_type_id: form.expense_type_id,
        amount: Number(form.amount),
        spentAt: toApiDate(form.spentAt),
      };
      if (editing) {
        return expensesApi.update(editing.id, payload);
      }
      return expensesApi.create(payload);
    },
    onSuccess: async () => {
      setForm((prev) => ({
        expense_type_id: expenseTypes[0]?.id || "",
        amount: "",
        spentAt: prev.spentAt,
      }));
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });

  const createTypeMutation = useMutation({
    mutationFn: expenseTypesApi.create,
    onSuccess: async (created) => {
      setNewTypeName("");
      await queryClient.invalidateQueries({ queryKey: ["expense-types"] });
      setForm((prev) => ({ ...prev, expense_type_id: created.id }));
    },
  });

  const removeMutation = useMutation({
    mutationFn: expensesApi.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: () =>
      matchesApi.upsert({
        playedOn: day,
        player_ids: selectedIds,
      }),
    onSuccess: async () => {
      setInfo("Presença salva.");
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const saved = await matchesApi.upsert({
        playedOn: day,
        player_ids: selectedIds,
      });
      return matchesApi.generateShares(saved.id);
    },
    onSuccess: async (result) => {
      setInfo(
        result.already_existed
          ? "Rateio já estava gerado para este dia."
          : "Cobrança do rateio gerada."
      );
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const payShareMutation = useMutation({
    mutationFn: matchesApi.markSharePaid,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const cancelShareMutation = useMutation({
    mutationFn: matchesApi.cancelShare,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  async function run(action: () => Promise<unknown>, fallback: string) {
    setError("");
    setInfo("");
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : fallback);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await run(() => saveMutation.mutateAsync(), "Erro ao salvar item");
  }

  async function handleCreateType(event: FormEvent) {
    event.preventDefault();
    await run(
      () => createTypeMutation.mutateAsync(newTypeName),
      "Erro ao criar tipo de despesa"
    );
  }

  function startEdit(expense: Expense) {
    setEditing(expense);
    setForm({
      expense_type_id: expense.expenseTypeId || expense.expenseType?.id || "",
      amount: String(expense.amount),
      spentAt: toDateInputValue(expense.spentAt),
    });
  }

  function togglePlayer(id: string) {
    if (hasPaidShare) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function setGroup(ids: string[], checked: boolean) {
    if (hasPaidShare) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return [...next];
    });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Despesas</h1>
          <p>Itens do dia, quem jogou e rateio por pessoa</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="field">
          <label>Dia da pelada</label>
          <input
            type="date"
            value={day}
            onChange={(e) => {
              setEditing(null);
              setError("");
              setInfo("");
              setDay(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <span>Itens do dia</span>
          <strong>{expenses.length}</strong>
        </div>
        <div className="stat-card">
          <span>Total do dia</span>
          <strong>{money(total)}</strong>
        </div>
        <div className="stat-card">
          <span>Quem jogou</span>
          <strong>{playerCount}</strong>
        </div>
        <div className="stat-card">
          <span>Por pessoa</span>
          <strong>{playerCount && total > 0 ? money(sharePreview) : "—"}</strong>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? (
        <p style={{ color: "var(--ok)", marginTop: 0 }}>{info}</p>
      ) : null}

      {isAdmin ? (
        <form
          className="panel"
          onSubmit={handleCreateType}
          style={{ marginBottom: 20 }}
        >
          <h2 style={{ marginTop: 0 }}>Cadastrar novo tipo</h2>
          <div className="form-grid">
            <div className="field">
              <label>Nome do item</label>
              <input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Gelo, Refrigerante, Colete..."
                required
              />
            </div>
          </div>
          <button className="btn" type="submit">
            Adicionar tipo
          </button>
        </form>
      ) : null}

      {isAdmin ? (
        <form className="panel" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>
            {editing ? "Editar item" : "Somar item na lista"}
          </h2>
          <div className="form-grid cols-3">
            <div className="field">
              <label>Tipo</label>
              <select
                value={form.expense_type_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    expense_type_id: e.target.value,
                  })
                }
                required
              >
                <option value="">Selecione</option>
                {expenseTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Valor</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Data</label>
              <input
                type="date"
                value={form.spentAt}
                onChange={(e) => {
                  setForm({ ...form, spentAt: e.target.value });
                  if (!editing) setDay(e.target.value);
                }}
                required
              />
            </div>
          </div>
          <div className="actions">
            <button className="btn" type="submit">
              {editing ? "Salvar alteração" : "Somar na lista"}
            </button>
            {editing ? (
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm((prev) => ({
                    expense_type_id: expenseTypes[0]?.id || "",
                    amount: "",
                    spentAt: day,
                  }));
                }}
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="panel" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0 }}>Lista de {formatDateBr(day)}</h2>
          <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem" }}>
            Total: {money(total)}
          </strong>
        </div>

        {isLoading ? <p>Carregando...</p> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Data</th>
                <th>Valor</th>
                {isAdmin ? <th>Ações</th> : null}
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.expenseType?.name || expense.description}</td>
                  <td>{formatDateBr(expense.spentAt)}</td>
                  <td>{money(expense.amount)}</td>
                  {isAdmin ? (
                    <td>
                      <div className="actions">
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => startEdit(expense)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-danger"
                          type="button"
                          onClick={() => removeMutation.mutate(expense.id)}
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
              {!isLoading && expenses.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3}>
                    Nenhum item neste dia. Some um tipo e um valor na lista.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <h2 style={{ margin: 0 }}>Quem jogou</h2>
          <div className="field" style={{ margin: 0, minWidth: 180 }}>
            <label>Buscar</label>
            <input
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              placeholder="Ney, Duda..."
            />
          </div>
        </div>

        {hasPaidShare ? (
          <p style={{ color: "var(--muted)", marginTop: 0 }}>
            Há rateio já pago. Cancele os pagamentos para alterar a presença.
          </p>
        ) : null}

        <div className="split-lists">
          <PlayerPickGroup
            title="Mensalistas"
            players={monthly}
            selectedIds={selectedIds}
            disabled={!isAdmin || hasPaidShare}
            onToggle={togglePlayer}
            onSetGroup={setGroup}
          />
          <PlayerPickGroup
            title="Convidados"
            players={casual}
            selectedIds={selectedIds}
            disabled={!isAdmin || hasPaidShare}
            onToggle={togglePlayer}
            onSetGroup={setGroup}
          />
        </div>

        {isAdmin ? (
          <div className="actions" style={{ marginTop: 16 }}>
            <button
              className="btn-secondary"
              type="button"
              disabled={selectedIds.length === 0 || hasPaidShare}
              onClick={() =>
                run(
                  () => saveAttendanceMutation.mutateAsync(),
                  "Erro ao salvar quem jogou"
                )
              }
            >
              Salvar quem jogou
            </button>
            <button
              className="btn"
              type="button"
              disabled={selectedIds.length === 0 || total <= 0}
              onClick={() =>
                run(
                  () => generateMutation.mutateAsync(),
                  "Erro ao gerar rateio"
                )
              }
            >
              Gerar cobrança do rateio
            </button>
          </div>
        ) : null}
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Rateio do dia</h2>
        {staleRateio ? (
          <p style={{ color: "var(--warn)" }}>
            Despesas ou presença mudaram. Gere o rateio de novo.
          </p>
        ) : null}
        {activeShares.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            {total > 0 && playerCount > 0
              ? `Cada um pagaria ${money(sharePreview)}. Gere a cobrança para lançar.`
              : "Some as despesas do dia e marque quem jogou."}
          </p>
        ) : null}
        {activeShares.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Jogador</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Status</th>
                  {isAdmin ? <th>Ações</th> : null}
                </tr>
              </thead>
              <tbody>
                {activeShares.map((share) => (
                  <tr key={share.id}>
                    <td>{share.player?.name}</td>
                    <td>
                      <span
                        className={`badge ${playerTypeClass(
                          share.player?.type || ""
                        )}`}
                      >
                        {PLAYER_TYPE_LABEL[share.player?.type || ""] ||
                          share.player?.type}
                      </span>
                    </td>
                    <td>
                      {money(share.amount)}
                      {remainingOf(share) > 0 && share.status !== "PAID"
                        ? ` · falta ${money(remainingOf(share))}`
                        : ""}
                    </td>
                    <td>
                      <span
                        className={`badge ${paymentStatusClass(share.status)}`}
                      >
                        {PAYMENT_STATUS_LABEL[share.status] || share.status}
                      </span>
                    </td>
                    {isAdmin ? (
                      <td>
                        <div className="actions">
                          {share.status !== "PAID" ? (
                            <button
                              className="btn"
                              type="button"
                              onClick={() =>
                                run(
                                  () => payShareMutation.mutateAsync(share.id),
                                  "Erro ao registrar pagamento"
                                )
                              }
                            >
                              Pagar
                            </button>
                          ) : null}
                          <button
                            className="btn-danger"
                            type="button"
                            onClick={() =>
                              run(
                                () => cancelShareMutation.mutateAsync(share.id),
                                "Erro ao cancelar rateio"
                              )
                            }
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PlayerPickGroup({
  title,
  players,
  selectedIds,
  disabled,
  onToggle,
  onSetGroup,
}: {
  title: string;
  players: Player[];
  selectedIds: string[];
  disabled: boolean;
  onToggle: (id: string) => void;
  onSetGroup: (ids: string[], checked: boolean) => void;
}) {
  const ids = players.map((player) => player.id);
  const selectedCount = players.filter((player) =>
    selectedIds.includes(player.id)
  ).length;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <strong>
          {title} ({selectedCount}/{players.length})
        </strong>
        {!disabled ? (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => onSetGroup(ids, selectedCount < players.length)}
          >
            {selectedCount < players.length ? "Todos" : "Nenhum"}
          </button>
        ) : null}
      </div>
      <div className="player-pick-list">
        {players.map((player) => (
          <label key={player.id} className="player-pick-item">
            <input
              type="checkbox"
              checked={selectedIds.includes(player.id)}
              disabled={disabled}
              onChange={() => onToggle(player.id)}
            />
            <span>{player.name}</span>
          </label>
        ))}
        {players.length === 0 ? (
          <p style={{ color: "var(--muted)", margin: 8 }}>Nenhum jogador.</p>
        ) : null}
      </div>
    </div>
  );
}
