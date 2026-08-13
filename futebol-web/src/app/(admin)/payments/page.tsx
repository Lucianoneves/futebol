"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, QueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { paymentsApi, playersApi } from "@/lib/services";
import {
  money,
  monthLabel,
  PAYMENT_STATUS_LABEL,
  PLAYER_TYPE_LABEL,
  paymentStatusClass,
  remainingOf,
  sortByPtName,
  currentYearMonth,
  filterSortByName,
  partitionByPlayerType,
  NAME_SEARCH_PLACEHOLDER,
} from "@/lib/format";
import {
  copyReportImageWithFallback,
  renderReportPng,
  reportFromPayments,
  reportImageFilename,
} from "@/lib/reportImage";
import {
  copyPublicReportLink,
  sendPublicReportWhatsApp,
} from "@/lib/shareReport";
import { ApiError } from "@/lib/api";
import type { Payment } from "@/lib/types";

async function invalidatePaymentViews(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: ["payments"] });
  await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  await queryClient.invalidateQueries({ queryKey: ["report-monthly"] });
}

export default function PaymentsPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { year: initialYear, month: initialMonth } = currentYearMonth();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [playerId, setPlayerId] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [paidNow, setPaidNow] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [adjustValue, setAdjustValue] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [search, setSearch] = useState("");
  const [sharing, setSharing] = useState(false);

  const { data: players = [] } = useQuery({
    queryKey: ["players", true],
    queryFn: () => playersApi.list(true),
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", year, month],
    queryFn: () => paymentsApi.list({ year, month }),
  });

  const selected = payments.find((item) => item.id === selectedId) || null;

  const sortedPlayers = useMemo(
    () => [...players].sort((left, right) => sortByPtName(left.name, right.name)),
    [players]
  );

  const { monthly, casual, collected, expected, pending } = useMemo(() => {
    const active = payments.filter((item) => item.status !== "CANCELLED");
    const sorted = filterSortByName(
      active,
      search,
      (item) => item.player?.name || ""
    );
    const { monthly, casual } = partitionByPlayerType(
      sorted,
      (item) => item.player?.type
    );

    return {
      monthly,
      casual,
      collected: active.reduce(
        (sum, item) => sum + Number(item.paidAmount || 0),
        0
      ),
      expected: active.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      pending: active.reduce((sum, item) => sum + remainingOf(item), 0),
    };
  }, [payments, search]);

  const createMutation = useMutation({
    mutationFn: paymentsApi.create,
    onSuccess: async (payment) => {
      setNotes("");
      setAmount("");
      setPaidNow("");
      setSelectedId(payment.id);
      setEditAmount(String(payment.amount));
      setEditNotes(payment.notes || "");
      setAdjustValue("");
      if (payment.already_existed && !payment.carry_over?.length) {
        setInfo(
          "Este jogador já tinha cobrança neste mês (ainda não paga). Some o valor abaixo."
        );
      } else if (payment.carry_over?.length) {
        const text = payment.carry_over
          .map(
            (item) =>
              `${money(item.amount)} em ${monthLabel(item.month)}/${item.year}`
          )
          .join(", ");
        setInfo(`Saldo enviado para o próximo mês: ${text}`);
      } else {
        setInfo("");
      }
      await invalidatePaymentViews(queryClient);
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: number }) =>
      paymentsApi.addValue(id, value),
    onSuccess: async (result) => {
      setAdjustValue("");
      const carry = result.carry_over || [];
      if (carry.length > 0) {
        const text = carry
          .map((item) => `${money(item.amount)} em ${monthLabel(item.month)}/${item.year}`)
          .join(", ");
        setInfo(`Saldo enviado para o próximo mês: ${text}`);
      } else {
        setInfo("");
      }
      await invalidatePaymentViews(queryClient);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { amount?: number; notes?: string };
    }) => paymentsApi.update(id, data),
    onSuccess: async () => {
      await invalidatePaymentViews(queryClient);
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: "paid" | "overdue" | "cancel";
    }) => {
      if (action === "paid") return paymentsApi.markPaid(id);
      if (action === "overdue") return paymentsApi.markOverdue(id);
      return paymentsApi.cancel(id);
    },
    onSuccess: async () => {
      await invalidatePaymentViews(queryClient);
    },
  });

  const generateMonthMutation = useMutation({
    mutationFn: () => paymentsApi.generateMonth(year, month),
    onSuccess: async (result) => {
      setInfo(
        `Cobrança de ${monthLabel(result.month)}/${result.year}: ${result.created} novas, ${result.existing} já existiam, ${result.skipped_paid} já pagas.`
      );
      setError("");
      await invalidatePaymentViews(queryClient);
    },
  });

  async function handleCopyLink() {
    setSharing(true);
    try {
      setInfo(await copyPublicReportLink(year, month));
      setError("");
    } catch {
      setError("Não foi possível copiar o link.");
    } finally {
      setSharing(false);
    }
  }

  async function handleSendWhatsApp() {
    setSharing(true);
    try {
      setInfo(await sendPublicReportWhatsApp(year, month));
      setError("");
    } catch {
      setError("Não foi possível gerar o link do relatório.");
    } finally {
      setSharing(false);
    }
  }

  async function handleCopyImage() {
    setSharing(true);
    const report = reportFromPayments(payments, year, month);
    const result = await copyReportImageWithFallback(
      () => renderReportPng(report),
      reportImageFilename(report)
    );
    if (result.ok) {
      setInfo(result.message);
      setError("");
    } else {
      setError(result.message);
    }
    setSharing(false);
  }

  async function handleGenerateMonth() {
    setError("");
    try {
      await generateMonthMutation.mutateAsync();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Erro ao gerar cobrança dos mensalistas"
      );
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    try {
      await createMutation.mutateAsync({
        player_id: playerId,
        year,
        month,
        notes: notes || undefined,
        amount: amount ? Number(amount) : undefined,
        paid_amount: paidNow ? Number(paidNow) : undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao gerar pagamento");
    }
  }

  async function handleAdjust(direction: "add" | "subtract") {
    if (!selected) return;
    setError("");
    const value = Number(adjustValue);
    if (!value) {
      setError("Informe um valor");
      return;
    }
    try {
      await adjustMutation.mutateAsync({
        id: selected.id,
        value: direction === "add" ? value : -value,
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao ajustar pagamento"
      );
    }
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setError("");
    try {
      await updateMutation.mutateAsync({
        id: selected.id,
        data: {
          amount: editAmount ? Number(editAmount) : undefined,
          notes: editNotes,
        },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao editar pagamento");
    }
  }

  function selectPayment(payment: Payment) {
    setSelectedId(payment.id);
    setEditAmount(String(payment.amount));
    setEditNotes(payment.notes || "");
    setAdjustValue("");
    setError("");
    setInfo("");
  }

  const canAdjust =
    selected &&
    selected.status !== "CANCELLED" &&
    (selected.status !== "PAID" || selected.player?.type === "MONTHLY");

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pagamentos</h1>
          <p>
            Mensalista que pagar 80 sem atraso: 40 no mês vigente e 40 no próximo
          </p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <span>Total arrecadado</span>
          <strong>{money(collected)}</strong>
        </div>
        <div className="stat-card">
          <span>Pendente</span>
          <strong>{money(pending)}</strong>
        </div>
        <div className="stat-card">
          <span>Esperado no mês</span>
          <strong>{money(expected)}</strong>
        </div>
      </div>

      {isAdmin ? (
        <form className="panel" onSubmit={handleCreate} style={{ marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>Gerar / registrar pagamento</h2>
          {error && !selected ? <div className="error-box">{error}</div> : null}
          {info && !selected ? <p style={{ color: "var(--ok)" }}>{info}</p> : null}
          <div className="form-grid">
            <div className="field">
              <label>Jogador</label>
              <select
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                required
              >
                <option value="">Selecione</option>
                {sortedPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({PLAYER_TYPE_LABEL[player.type] || player.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Ano</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                required
              />
            </div>
            <div className="field">
              <label>Mês</label>
              <input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                required
              />
            </div>
            <div className="field">
              <label>Valor pago agora</label>
              <input
                type="number"
                step="0.01"
                value={paidNow}
                onChange={(e) => setPaidNow(e.target.value)}
                placeholder="Ex: 40 ou 80"
              />
            </div>
            <div className="field">
              <label>Valor total do mês (opcional)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Usa taxa do jogador"
              />
            </div>
            <div className="field full">
              <label>Observações</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <button className="btn" type="submit">
            Registrar
          </button>
        </form>
      ) : null}

      <div className="toolbar">
        <div className="field">
          <label>Filtrar ano</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Filtrar mês</label>
          <input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Buscar pelo nome</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={NAME_SEARCH_PLACEHOLDER}
          />
        </div>
        {isAdmin ? (
          <button
            className="btn"
            type="button"
            onClick={handleGenerateMonth}
            disabled={generateMonthMutation.isPending}
          >
            {generateMonthMutation.isPending
              ? "Gerando..."
              : "Gerar cobrança dos mensalistas"}
          </button>
        ) : null}
        <button
          className="btn-secondary"
          type="button"
          onClick={handleCopyLink}
          disabled={sharing}
        >
          Copiar link
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={handleSendWhatsApp}
          disabled={sharing}
        >
          Enviar no WhatsApp
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={handleCopyImage}
          disabled={sharing || payments.length === 0}
        >
          {sharing ? "Gerando..." : "Copiar imagem"}
        </button>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? (
        <p style={{ color: "var(--ok)", fontWeight: 600, marginTop: 0 }}>
          {info}
        </p>
      ) : null}

      {isLoading ? <p>Carregando...</p> : null}

      <div className="split-lists">
        <PaymentGroup
          title={`Mensalistas (${monthly.length}) · ${money(
            monthly.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0)
          )}`}
          payments={monthly}
          isAdmin={isAdmin}
          emptyText="Nenhum pagamento de mensalista neste mês."
          onSelect={selectPayment}
          onAction={(id, action) => actionMutation.mutate({ id, action })}
        />
        <PaymentGroup
          title={`Convidados (${casual.length}) · ${money(
            casual.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0)
          )}`}
          payments={casual}
          isAdmin={isAdmin}
          emptyText="Nenhum pagamento de convidado neste mês."
          onSelect={selectPayment}
          onAction={(id, action) => actionMutation.mutate({ id, action })}
        />
      </div>

      {isAdmin && selected ? (
        <div className="panel" style={{ marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>
            Editar: {selected.player?.name} ({monthLabel(selected.month)}/
            {selected.year})
          </h2>
          {error ? <div className="error-box">{error}</div> : null}
          {info ? (
            <p style={{ color: "var(--ok)", fontWeight: 600 }}>{info}</p>
          ) : null}
          <p style={{ color: "var(--muted)" }}>
            Total {money(selected.amount)} · Pago {money(selected.paidAmount || 0)} ·
            Restante {money(remainingOf(selected))}
          </p>

          {canAdjust ? (
            <div style={{ marginBottom: 20 }}>
              <h3>Somar ou subtrair valor pago</h3>
              <div className="form-grid">
                <div className="field">
                  <label>Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={adjustValue}
                    onChange={(e) => setAdjustValue(e.target.value)}
                    placeholder="Ex: 40 ou 80"
                  />
                </div>
              </div>
              <div className="actions">
                <button
                  className="btn"
                  type="button"
                  onClick={() => handleAdjust("add")}
                >
                  Somar
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => handleAdjust("subtract")}
                >
                  Subtrair
                </button>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleUpdate}>
            <h3>Editar total / notas</h3>
            <div className="form-grid">
              <div className="field">
                <label>Valor total do mês</label>
                <input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Observações</label>
                <input
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="actions">
              <button className="btn" type="submit">
                Salvar edição
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  setSelectedId("");
                  setInfo("");
                }}
              >
                Fechar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function PaymentGroup({
  title,
  payments,
  isAdmin,
  emptyText,
  onSelect,
  onAction,
}: {
  title: string;
  payments: Payment[];
  isAdmin: boolean;
  emptyText: string;
  onSelect: (payment: Payment) => void;
  onAction: (id: string, action: "paid" | "overdue" | "cancel") => void;
}) {
  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Jogador</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Restante</th>
              <th>Status</th>
              {isAdmin ? <th>Ações</th> : null}
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, index) => (
              <tr key={payment.id}>
                <td>{index + 1}</td>
                <td>{payment.player?.name || payment.playerId}</td>
                <td>{money(payment.amount)}</td>
                <td>{money(payment.paidAmount || 0)}</td>
                <td>{money(remainingOf(payment))}</td>
                <td>
                  <span className={`badge ${paymentStatusClass(payment.status)}`}>
                    {PAYMENT_STATUS_LABEL[payment.status] || payment.status}
                  </span>
                </td>
                {isAdmin ? (
                  <td>
                    <div className="actions">
                      {payment.status !== "CANCELLED" ? (
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => onSelect(payment)}
                        >
                          Editar
                        </button>
                      ) : null}
                      {payment.status !== "PAID" &&
                      payment.status !== "CANCELLED" ? (
                        <>
                          <button
                            className="btn"
                            type="button"
                            onClick={() => onAction(payment.id, "paid")}
                          >
                            Quitar
                          </button>
                          <button
                            className="btn-secondary"
                            type="button"
                            onClick={() => onAction(payment.id, "overdue")}
                          >
                            Atrasado
                          </button>
                        </>
                      ) : null}
                      {payment.status !== "CANCELLED" ? (
                        <button
                          className="btn-danger"
                          type="button"
                          onClick={() => onAction(payment.id, "cancel")}
                        >
                          Cancelar
                        </button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
            {payments.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6}>{emptyText}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
