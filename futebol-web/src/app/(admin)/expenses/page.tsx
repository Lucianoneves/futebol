"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  expensesApi,
  expenseTypesApi,
  matchesApi,
  playersApi,
  dashboardApi,
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
import type { Expense, Match, Player } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { DateInput } from "@/components/ui/DateInput";
import {
  copyReportImageWithFallback,
  expensesDayImageFilename,
  renderExpensesDayPng,
} from "@/lib/reportImage";

function emptyForm(spentAt = toDateInputValue()) {
  return {
    expense_type_id: "",
    amount: "",
    spentAt,
    fromMonthlyCash: true,
  };
}

function attendanceIds(match: Match | null) {
  if (!match) return [];
  const fromPlayers = match.players.map((item) => item.playerId);
  if (fromPlayers.length > 0) return fromPlayers;
  return (match.shares || [])
    .filter((share) => share.status !== "CANCELLED")
    .map((share) => share.playerId);
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
  const [sharing, setSharing] = useState(false);
  const hydratedDayRef = useRef<string | null>(null);
  const skipAutoRateioRef = useRef(false);

  const { data: expenseTypes = [] } = useQuery({
    queryKey: ["expense-types"],
    queryFn: expenseTypesApi.list,
  });

  const { data: expenses = [], isLoading, isFetched: expensesFetched } = useQuery({
    queryKey: ["expenses", day],
    queryFn: () => expensesApi.list({ spentAt: day }),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players", true],
    queryFn: () => playersApi.list(true),
  });

  const { data: matches = [], isFetched: matchesFetched } = useQuery({
    queryKey: ["matches", day],
    queryFn: () => matchesApi.list(day),
  });

  const financeYear = Number((form.spentAt || day).slice(0, 4));
  const financeMonth = Number((form.spentAt || day).slice(5, 7));

  const { data: finance } = useQuery({
    queryKey: ["dashboard", financeYear, financeMonth],
    queryFn: () => dashboardApi.balance(financeYear, financeMonth),
    enabled: Boolean(financeYear && financeMonth),
  });

  const match = matches[0] || null;
  const isCaixa = form.fromMonthlyCash;

  const visibleExpenses = useMemo(
    () =>
      expenses.filter((item) =>
        isCaixa ? item.fromMonthlyCash !== false : item.fromMonthlyCash === false
      ),
    [expenses, isCaixa]
  );

  const others = useMemo(
    () => expenses.filter((item) => item.id !== editing?.id),
    [expenses, editing]
  );

  const savedCaixaTotal = useMemo(
    () =>
      others
        .filter((item) => item.fromMonthlyCash !== false)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [others]
  );

  const savedRateioTotal = useMemo(
    () =>
      others
        .filter((item) => item.fromMonthlyCash === false)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [others]
  );

  const draftAmount = Number(form.amount) > 0 ? Number(form.amount) : 0;
  const caixaTotal = Number(
    (savedCaixaTotal + (form.fromMonthlyCash ? draftAmount : 0)).toFixed(2)
  );
  const rateioTotal = Number(
    (savedRateioTotal + (!form.fromMonthlyCash ? draftAmount : 0)).toFixed(2)
  );
  const listTotal = isCaixa ? caixaTotal : rateioTotal;

  const caixaDelta = useMemo(() => {
    if (editing) {
      const oldAmount =
        editing.fromMonthlyCash !== false ? Number(editing.amount || 0) : 0;
      const nextAmount = form.fromMonthlyCash ? draftAmount : 0;
      return Number((nextAmount - oldAmount).toFixed(2));
    }
    return form.fromMonthlyCash ? draftAmount : 0;
  }, [editing, form.fromMonthlyCash, draftAmount]);

  const monthOutcome = Number(
    ((finance?.outcome ?? 0) + caixaDelta).toFixed(2)
  );
  const monthRemaining = Number(
    ((finance?.remaining ?? finance?.balance ?? 0) - caixaDelta).toFixed(2)
  );

  const activeShares = useMemo(
    () =>
      (match?.shares || []).filter((share) => share.status !== "CANCELLED"),
    [match]
  );

  const hasPaidShare = activeShares.some((share) => share.status === "PAID");
  const rateioPaid = Number(
    activeShares
      .reduce((sum, share) => sum + Number(share.paidAmount || 0), 0)
      .toFixed(2)
  );
  const churrascoRestante =
    activeShares.length > 0
      ? Number(
          Math.max(
            0,
            activeShares.reduce((sum, share) => sum + remainingOf(share), 0)
          ).toFixed(2)
        )
      : rateioTotal;
  const playerCount = selectedIds.length;
  const sharePreview =
    playerCount > 0 && rateioTotal > 0
      ? Number((rateioTotal / playerCount).toFixed(2))
      : 0;

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
    const attendanceChanged =
      selectedIds.length > 0 && sharePlayers !== selected;
    return attendanceChanged || Math.abs(shareTotal - savedRateioTotal) > 0.009;
  }, [activeShares, selectedIds, savedRateioTotal]);

  const { monthly, casual, fees } = useMemo(() => {
    const sorted = filterSortByName(players, playerSearch, (player) => player.name);
    return partitionByPlayerType(sorted, (player) => player.type);
  }, [players, playerSearch]);

  useEffect(() => {
    if (!form.expense_type_id && expenseTypes[0]) {
      setForm((prev) => ({ ...prev, expense_type_id: expenseTypes[0].id }));
    }
  }, [expenseTypes, form.expense_type_id]);

  function setPayMode(fromMonthlyCash: boolean) {
    const switchingAway =
      editing && (editing.fromMonthlyCash !== false) !== fromMonthlyCash;
    if (switchingAway) setEditing(null);
    setError("");
    setInfo("");
    setForm((prev) => ({
      ...prev,
      fromMonthlyCash,
      amount: switchingAway ? "" : prev.amount,
    }));
  }

  function applyDay(next: string) {
    if (next === day) return;

    skipAutoRateioRef.current = true;
    hydratedDayRef.current = null;
    setEditing(null);
    setError("");
    setInfo("");
    setSelectedIds([]);
    setPlayerSearch("");
    setForm((prev) => ({
      expense_type_id: prev.expense_type_id,
      amount: "",
      spentAt: next,
      fromMonthlyCash: true,
    }));
    setDay(next);
  }

  useEffect(() => {
    if (!expensesFetched || !matchesFetched) return;
    if (hydratedDayRef.current === day) return;

    hydratedDayRef.current = day;
    const savedIds = attendanceIds(match);
    setSelectedIds(savedIds);

    if (skipAutoRateioRef.current) {
      skipAutoRateioRef.current = false;
      return;
    }

    if (editing) return;

    const hasRateio = expenses.some((item) => item.fromMonthlyCash === false);
    setForm((prev) => ({
      ...prev,
      fromMonthlyCash: !(hasRateio || savedIds.length > 0),
    }));
  }, [day, expensesFetched, matchesFetched, expenses, match, editing]);

  async function refreshFinance() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["expenses"] }),
      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
        refetchType: "all",
      }),
      queryClient.invalidateQueries({ queryKey: ["matches"] }),
    ]);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const spentAt = toApiDate(form.spentAt);
      if (!form.fromMonthlyCash && selectedIds.length > 0) {
        await matchesApi.upsert({
          playedOn: form.spentAt,
          player_ids: selectedIds,
        });
      }
      const payload = {
        expense_type_id: form.expense_type_id,
        amount: Number(form.amount),
        spentAt,
        from_monthly_cash: form.fromMonthlyCash,
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
        fromMonthlyCash: prev.fromMonthlyCash,
      }));
      setEditing(null);
      setInfo(
        form.fromMonthlyCash
          ? "Valor lançado no caixa do time. Gastos do mês e saldo restante atualizados."
          : "Item somado no rateio do dia."
      );
      await refreshFinance();
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
      await refreshFinance();
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
      await refreshFinance();
    },
  });

  const payShareMutation = useMutation({
    mutationFn: matchesApi.markSharePaid,
    onSuccess: async () => {
      await refreshFinance();
    },
  });

  const cancelShareMutation = useMutation({
    mutationFn: matchesApi.cancelShare,
    onSuccess: async (share) => {
      setSelectedIds((prev) => prev.filter((id) => id !== share.playerId));
      setInfo("Jogador cancelado. O valor foi dividido entre quem ficou na lista.");
      await refreshFinance();
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
      fromMonthlyCash: expense.fromMonthlyCash !== false,
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

  async function handleCopyImage() {
    setSharing(true);
    const result = await copyReportImageWithFallback(
      () =>
        renderExpensesDayPng({
          dayLabel: formatDateBr(day),
          caixaTotal,
          churrascoRestante,
          churrascoPaid: rateioPaid,
          playerCount,
          perPerson: sharePreview,
          items: visibleExpenses.map((expense) => ({
            name: expense.expenseType?.name || expense.description,
            pay: isCaixa ? "Caixa" : "Rateio",
            amount: Number(expense.amount || 0),
          })),
          shares: isCaixa
            ? []
            : activeShares.map((share) => ({
                name: share.player?.name || "Jogador",
                type: share.player?.type,
                status: share.status,
                amount: Number(share.amount || 0),
                remaining: remainingOf(share),
              })),
        }),
      expensesDayImageFilename(day)
    );
    if (result.ok) {
      setInfo(result.message);
      setError("");
    } else {
      setError(result.message);
    }
    setSharing(false);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Despesas</h1>
          {!isAdmin ? (
            <span className="consult-badge">Somente consulta</span>
          ) : null}
          <p>
            Despesa do caixa sai do saldo restante. Despesa do rateio é dividida
            entre quem jogou e não desconta o caixa do time.
          </p>
        </div>
        
      </div>
      

      <div className="toolbar">
        <div className="field">
          <label>Dia da pelada</label>
          <DateInput value={day} onChange={applyDay} />
        </div>
        <button
          className="btn-secondary"
          type="button"
          onClick={handleCopyImage}
          disabled={sharing}
        >
          {sharing ? "Gerando..." : "Copiar imagem"}
        </button>
      </div>

      <div
        className={isCaixa ? "grid-3" : "grid-3"}
        style={{ marginBottom: 20 }}
      >
        {isCaixa ? (
          <>
           
            <div className="stat-card">
              <span>Churrasco do mês (caixa do time)</span>
              <strong>{money(monthOutcome)}</strong>
            </div>
            <div className="stat-card">
              <span>Saldo restante total caixa</span>
              <strong
                style={{
                  color: monthRemaining < 0 ? "var(--danger)" : "var(--ok)",
                }}
              >
                {money(monthRemaining)}
              </strong>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <span>Valor do Churrasco Total à parte</span>
              <strong>{money(churrascoRestante)}</strong>
              {rateioPaid > 0 ? (
                <span>Já pago {money(rateioPaid)}</span>
              ) : null}
            </div>
            <div className="stat-card">
              <span>Jogadores que ficaram para o churrasco</span>
              <strong>{playerCount}</strong>
            </div>
            <div className="stat-card">
              <span>Por pessoa</span>
              <strong>
                {sharePreview > 0 ? money(sharePreview) : "—"}
              </strong>
            </div>
          </>
        )}
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
              <DateInput
                value={form.spentAt}
                required
                onChange={(next) => {
                  if (editing) {
                    setForm({ ...form, spentAt: next });
                    return;
                  }
                  applyDay(next);
                }}
              />
            </div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Como paga</label>
            <div className="split-lists" style={{ marginTop: 8 }}>
              <label className="player-pick-item">
                <input
                  type="radio"
                  name="expense-pay"
                  checked={form.fromMonthlyCash}
                  onChange={() => setPayMode(true)}
                />
                <span>Churrasco do time (caixa do time)</span>
              </label>
              <label className="player-pick-item">
                <input
                  type="radio"
                  name="expense-pay"
                  checked={!form.fromMonthlyCash}
                  onChange={() => setPayMode(false)}
                />
                <span>Rateio do dia ( valor divido entre quem  ficou para o churrasco sem desconta do caixa do time)</span>
              </label>
            </div>
            {form.fromMonthlyCash ? (
              <p style={{ color: "var(--muted)", margin: "10px 0 0" }}>
                {draftAmount > 0
                  ? `Este valor vai para Sai do caixa. Gastos do mês: ${money(monthOutcome)} · Saldo restante: ${money(monthRemaining)}`
                  : "Informe o valor. Ao somar na lista, desconta gastos do mês e o saldo restante do caixa."}
              </p>
            ) : (
              <p style={{ color: "var(--muted)", margin: "10px 0 0" }}>
                {playerCount > 0 && rateioTotal > 0
                  ? `Valor por pessoa: ${money(sharePreview)} · ${playerCount} jogador${playerCount === 1 ? "" : "es"}`
                  : playerCount === 0
                    ? "Marque quem ficou, inclusive sem taxa. Esse valor não é mensalidade e não sai do caixa."
                    : "Informe o valor do item para ver o rateio."}
              </p>
            )}
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
                    fromMonthlyCash: prev.fromMonthlyCash,
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
          <h2 style={{ margin: 0 }}>
            {isCaixa ? "Lista do caixa" : "Lista do rateio"} · {formatDateBr(day)}
          </h2>
          <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem" }}>
            Total: {money(listTotal)}
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
              {visibleExpenses.map((expense) => (
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
              {!isLoading && visibleExpenses.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3}>
                    {isCaixa
                      ? "Nenhum item do caixa neste dia."
                      : "Nenhum item de rateio neste dia."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {!isCaixa ? (
        <>
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
          <div>
            <h2 style={{ margin: 0 }}>Quem ficou para o churrasco</h2>
            <p style={{ color: "var(--muted)", margin: "6px 0 0" }}>
              Mensalistas, convidados e jogadores sem taxa entram neste rateio.
              Não desconta o caixa e não gera mensalidade.
            </p>
          </div>
          <div className="actions" style={{ margin: 0, gap: 8, flexWrap: "wrap" }}>
            <div className="field" style={{ margin: 0, minWidth: 180 }}>
              <label>Buscar</label>
              <input
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                placeholder="Ney, Duda..."
              />
            </div>
            {isAdmin && !hasPaidShare ? (
              <button
                className="btn-secondary"
                type="button"
                disabled={selectedIds.length === 0}
                onClick={() => setSelectedIds([])}
              >
                Desmarcar todos
              </button>
            ) : null}
          </div>
        </div>

        {hasPaidShare ? (
          <p style={{ color: "var(--muted)", marginTop: 0 }}>
            Há rateio já pago. Cancele os pagamentos para alterar a presença.
          </p>
        ) : null}

        {playerCount > 0 && rateioTotal > 0 ? (
          <p style={{ marginTop: 0 }}>
            <strong>Valor por pessoa: {money(sharePreview)}</strong>
            {" · "}
            {money(rateioTotal)} dividido por {playerCount} jogador
            {playerCount === 1 ? "" : "es"}
          </p>
        ) : playerCount > 0 ? (
          <p style={{ color: "var(--muted)", marginTop: 0 }}>
            O rateio divide só os itens marcados como rateio. Informe o valor
            ou some o item na lista para ver o valor por pessoa.
          </p>
        ) : null}

        <div className="split-lists cols-3">
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
          <PlayerPickGroup
            title="Sem taxa"
            players={fees}
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
              disabled={selectedIds.length === 0 || savedRateioTotal <= 0}
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
            {rateioTotal > 0 && playerCount > 0
              ? `Cada um pagaria ${money(sharePreview)}. Gere a cobrança para lançar.`
              : "Some as despesas de rateio e marque quem jogou."}
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
        </>
      ) : null}
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
