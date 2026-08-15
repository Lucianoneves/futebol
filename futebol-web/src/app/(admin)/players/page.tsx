"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { playersApi } from "@/lib/services";
import { money, monthName, filterSortByName, partitionByPlayerType, PAYMENT_STATUS_LABEL, paymentStatusClass, NAME_SEARCH_PLACEHOLDER, visibleHistoryPayment } from "@/lib/format";
import type { Player, PlayerType, PlayerYearHistory } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { WhatsAppImportPanel } from "@/components/players/WhatsAppImportPanel";
import {
  copyReportImageWithFallback,
  playersImageFilename,
  renderPlayersPng,
} from "@/lib/reportImage";

const HIDDEN_INACTIVE_KEY = "futebol-hidden-inactive-players";

function readHiddenInactiveIds() {
  if (typeof window === "undefined") return [] as string[];
  try {
    const parsed = JSON.parse(localStorage.getItem(HIDDEN_INACTIVE_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function writeHiddenInactiveIds(ids: string[]) {
  localStorage.setItem(HIDDEN_INACTIVE_KEY, JSON.stringify(ids));
}

const emptyForm = {
  name: "",
  type: "MONTHLY" as PlayerType,
  email: "",
  phone: "",
};

export default function PlayersPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Player | null>(null);
  const [error, setError] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);
  const [search, setSearch] = useState("");
  const [historyPlayer, setHistoryPlayer] = useState<Player | null>(null);
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [accessPlayer, setAccessPlayer] = useState<Player | null>(null);
  const [accessEmail, setAccessEmail] = useState("");
  const [accessPassword, setAccessPassword] = useState("");
  const [accessInfo, setAccessInfo] = useState("");
  const [hiddenInactiveIds, setHiddenInactiveIds] = useState<string[]>([]);
  const [sharing, setSharing] = useState(false);
  const [info, setInfo] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHiddenInactiveIds(readHiddenInactiveIds());
  }, []);

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players", onlyActive],
    queryFn: () => playersApi.list(onlyActive),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["player-history", historyPlayer?.id, historyYear],
    queryFn: () => playersApi.history(historyPlayer!.id, historyYear),
    enabled: Boolean(historyPlayer?.id),
  });

  const { monthly, casual } = useMemo(() => {
    const visible = onlyActive
      ? players
      : players.filter((player) => !hiddenInactiveIds.includes(player.id));
    const filtered = filterSortByName(visible, search, (player) => player.name);
    return partitionByPlayerType(filtered, (player) => player.type);
  }, [players, search, onlyActive, hiddenInactiveIds]);

  function hideInactivePlayer(id: string) {
    setHiddenInactiveIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      writeHiddenInactiveIds(next);
      return next;
    });
  }

  function restoreHiddenInactive() {
    writeHiddenInactiveIds([]);
    setHiddenInactiveIds([]);
  }

  async function handleCopyImage() {
    setSharing(true);
    setError("");
    setInfo("");
    const result = await copyReportImageWithFallback(
      () =>
        renderPlayersPng({
          onlyActive,
          monthly: monthly.map((player) => ({
            name: player.name,
            fee: Number(
              player.type === "MONTHLY" ? player.monthlyFee : player.casualFee
            ),
            active: player.active,
          })),
          casual: casual.map((player) => ({
            name: player.name,
            fee: Number(
              player.type === "MONTHLY" ? player.monthlyFee : player.casualFee
            ),
            active: player.active,
          })),
        }),
      playersImageFilename(onlyActive)
    );
    if (result.ok) {
      setInfo(result.message);
    } else {
      setError(result.message);
    }
    setSharing(false);
  }

  const createMutation = useMutation({
    mutationFn: playersApi.create,
    onSuccess: async () => {
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name: string;
        type: PlayerType;
        email?: string;
        phone?: string;
      };
    }) => playersApi.update(id, data),
    onSuccess: async () => {
      setEditing(null);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: playersApi.deactivate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: playersApi.activate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });

  const accessMutation = useMutation({
    mutationFn: ({
      id,
      email,
      password,
    }: {
      id: string;
      email: string;
      password: string;
    }) => playersApi.grantAccess(id, { email, password }),
    onSuccess: async () => {
      setAccessPassword("");
      setAccessInfo("Acesso liberado. O jogador entra em /login e vai para /eu.");
      await queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const payload = {
        name: form.name,
        type: form.type,
        email: form.email || undefined,
        phone: form.phone || undefined,
      };
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar jogador");
    }
  }

  function startAccess(player: Player) {
    setAccessPlayer(player);
    setAccessEmail(player.accessEmail || player.email || "");
    setAccessPassword("");
    setAccessInfo("");
    setError("");
  }

  async function handleAccess(event: FormEvent) {
    event.preventDefault();
    if (!accessPlayer) return;
    setError("");
    setAccessInfo("");
    try {
      await accessMutation.mutateAsync({
        id: accessPlayer.id,
        email: accessEmail,
        password: accessPassword,
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao liberar acesso"
      );
    }
  }

  function startEdit(player: Player) {
    setEditing(player);
    setForm({
      name: player.name,
      type: player.type,
      email: player.email || "",
      phone: player.phone || "",
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    nameInputRef.current?.focus({ preventScroll: true });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Jogadores</h1>
          <p>Cadastro, lista do WhatsApp e taxas de mensalistas e convidados</p>
        </div>
      </div>

      {isAdmin ? <WhatsAppImportPanel /> : null}

      {isAdmin ? (
        <form
          ref={formRef}
          className="panel"
          onSubmit={handleSubmit}
          style={{ marginBottom: 20, scrollMarginTop: 16 }}
        >
          <h2 style={{ marginTop: 0 }}>
            {editing ? "Editar jogador" : "Novo jogador"}
          </h2>
          {error ? <div className="error-box">{error}</div> : null}
          <div className="form-grid">
            <div className="field">
              <label>Nome</label>
              <input
                ref={nameInputRef}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Tipo</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as PlayerType })
                }
              >
                <option value="MONTHLY">MENSALISTAS</option>
                <option value="CASUAL">CONVIDADOS</option>
              </select>
            </div>
            <div className="field">
              <label>E-mail</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="actions">
            <button className="btn" type="submit">
              {editing ? "Salvar" : "Criar"}
            </button>
            {editing ? (
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm);
                }}
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="toolbar">
        <div className="field">
          <label>Buscar pelo nome</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={NAME_SEARCH_PLACEHOLDER}
          />
        </div>
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            paddingBottom: 10,
          }}
        >
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
          />
          Somente ativos
        </label>
        {!onlyActive && hiddenInactiveIds.length > 0 ? (
          <button
            className="btn-secondary"
            type="button"
            onClick={restoreHiddenInactive}
          >
            Mostrar ocultos ({hiddenInactiveIds.length})
          </button>
        ) : null}
        <button
          className="btn-secondary"
          type="button"
          onClick={handleCopyImage}
          disabled={sharing}
        >
          {sharing ? "Gerando..." : "Copiar imagem"}
        </button>
      </div>

      {isLoading ? <p>Carregando...</p> : null}
      {info ? (
        <p style={{ color: "var(--ok)", fontWeight: 600, marginTop: 0 }}>
          {info}
        </p>
      ) : null}

      <div className="split-lists">
        <PlayerGroup
          title={`Mensalistas (${monthly.length})`}
          players={monthly}
          isAdmin={isAdmin}
          emptyText="Nenhum mensalista encontrado."
          onHistory={setHistoryPlayer}
          onAccess={isAdmin ? startAccess : undefined}
          onEdit={startEdit}
          onDeactivate={(id) => deactivateMutation.mutate(id)}
          onActivate={(id) => activateMutation.mutate(id)}
          onHide={isAdmin && !onlyActive ? hideInactivePlayer : undefined}
        />
        <PlayerGroup
          title={`Convidados (${casual.length})`}
          players={casual}
          isAdmin={isAdmin}
          emptyText="Nenhum convidado encontrado."
          onHistory={setHistoryPlayer}
          onAccess={isAdmin ? startAccess : undefined}
          onEdit={startEdit}
          onDeactivate={(id) => deactivateMutation.mutate(id)}
          onActivate={(id) => activateMutation.mutate(id)}
          onHide={isAdmin && !onlyActive ? hideInactivePlayer : undefined}
        />
      </div>

      {accessPlayer ? (
        <form className="panel" onSubmit={handleAccess} style={{ marginTop: 16 }}>
          <div className="page-header" style={{ marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: 0 }}>Acesso de {accessPlayer.name}</h2>
              <p>
                Libera login no mesmo site. Depois do deploy, o jogador entra e
                vê só a consulta em /eu.
              </p>
            </div>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                setAccessPlayer(null);
                setAccessInfo("");
              }}
            >
              Fechar
            </button>
          </div>
          {accessPlayer.hasAccess ? (
            <p style={{ color: "var(--ok)" }}>
              Já tem acesso ({accessPlayer.accessEmail}). Informe uma senha nova
              para atualizar.
            </p>
          ) : null}
          {accessInfo ? (
            <p style={{ color: "var(--ok)" }}>{accessInfo}</p>
          ) : null}
          {error && accessPlayer ? <div className="error-box">{error}</div> : null}
          <div className="form-grid">
            <div className="field">
              <label>E-mail de login</label>
              <input
                type="email"
                value={accessEmail}
                onChange={(e) => setAccessEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Senha</label>
              <input
                type="password"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>
          <button className="btn" type="submit">
            {accessPlayer.hasAccess ? "Atualizar acesso" : "Liberar acesso"}
          </button>
        </form>
      ) : null}

      {historyPlayer ? (
        <PlayerHistoryPanel
          player={historyPlayer}
          year={historyYear}
          history={history}
          loading={historyLoading}
          onYearChange={setHistoryYear}
          onClose={() => setHistoryPlayer(null)}
        />
      ) : null}
    </div>
  );
}

function PlayerGroup({
  title,
  players,
  isAdmin,
  emptyText,
  onHistory,
  onAccess,
  onEdit,
  onDeactivate,
  onActivate,
  onHide,
}: {
  title: string;
  players: Player[];
  isAdmin: boolean;
  emptyText: string;
  onHistory: (player: Player) => void;
  onAccess?: (player: Player) => void;
  onEdit: (player: Player) => void;
  onDeactivate: (id: string) => void;
  onActivate: (id: string) => void;
  onHide?: (id: string) => void;
}) {
  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>Taxa</th>
              <th>Contato</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={player.id}>
                <td>{index + 1}</td>
                <td>{player.name}</td>
                <td>
                  {money(
                    player.type === "MONTHLY"
                      ? player.monthlyFee
                      : player.casualFee
                  )}
                </td>
                <td>{player.phone || player.email || "-"}</td>
                <td>
                  <span className={`badge ${player.active ? "ok" : "muted"}`}>
                    {player.active ? "Ativo" : "Inativo"}
                  </span>
                  {player.hasAccess ? (
                    <span className="badge monthly" style={{ marginLeft: 6 }}>
                      App
                    </span>
                  ) : null}
                </td>
                <td>
                  <div className="actions">
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => onHistory(player)}
                    >
                      Histórico
                    </button>
                    {isAdmin ? (
                      <>
                        {onAccess && player.active ? (
                          <button
                            className="btn-secondary"
                            type="button"
                            onClick={() => onAccess(player)}
                          >
                            Acesso
                          </button>
                        ) : null}
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => onEdit(player)}
                        >
                          Editar
                        </button>
                        {player.active ? (
                          <button
                            className="btn-danger"
                            type="button"
                            onClick={() => onDeactivate(player.id)}
                          >
                            Desativar
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn"
                              type="button"
                              onClick={() => onActivate(player.id)}
                            >
                              Reativar
                            </button>
                            {onHide ? (
                              <button
                                className="btn-danger"
                                type="button"
                                onClick={() => onHide(player.id)}
                              >
                                Apagar
                              </button>
                            ) : null}
                          </>
                        )}
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {players.length === 0 ? (
              <tr>
                <td colSpan={6}>{emptyText}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayerHistoryPanel({
  player,
  year,
  history,
  loading,
  onYearChange,
  onClose,
}: {
  player: Player;
  year: number;
  history: PlayerYearHistory | undefined;
  loading: boolean;
  onYearChange: (year: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <div className="page-header" style={{ marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Histórico de {player.name}</h2>
          <p>
            O que pagou em cada mês. O mês seguinte só fica pendente a partir do
            dia 21. Atraso automático no dia 21 do mês seguinte.
          </p>
        </div>
        <button className="btn-secondary" type="button" onClick={onClose}>
          Fechar
        </button>
      </div>
      <div className="toolbar">
        <div className="field">
          <label>Ano</label>
          <input
            type="number"
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
          />
        </div>
      </div>
      {loading ? <p>Carregando...</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Status</th>
              <th>Cobrado</th>
              <th>Pago</th>
              <th>Falta</th>
            </tr>
          </thead>
          <tbody>
            {(history?.months ?? []).map((item) => {
              const payment = visibleHistoryPayment(
                item.payment,
                year,
                item.month,
                history?.overdue_day
              );

              return (
                <tr key={item.month}>
                  <td>
                    {monthName(item.month)}/{year}
                  </td>
                  <td>
                    {payment ? (
                      <span className={`badge ${paymentStatusClass(payment.status)}`}>
                        {PAYMENT_STATUS_LABEL[payment.status] || payment.status}
                      </span>
                    ) : (
                      <span className="badge muted">Sem cobrança</span>
                    )}
                  </td>
                  <td>{payment ? money(payment.amount) : "-"}</td>
                  <td>{payment ? money(payment.paidAmount) : "-"}</td>
                  <td>{payment ? money(payment.remaining) : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
