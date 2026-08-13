"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { playersApi } from "@/lib/services";
import { money, normalizeSearch, sortByPtName } from "@/lib/format";
import type { Player, PlayerType } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { WhatsAppImportPanel } from "@/components/players/WhatsAppImportPanel";

const emptyForm = {
  name: "",
  type: "MONTHLY" as PlayerType,
  email: "",
  phone: "",
};

function sortByName(left: Player, right: Player) {
  return sortByPtName(left.name, right.name);
}

export default function PlayersPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Player | null>(null);
  const [error, setError] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);
  const [search, setSearch] = useState("");

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players", onlyActive],
    queryFn: () => playersApi.list(onlyActive ? true : undefined),
  });

  const { monthly, casual } = useMemo(() => {
    const query = normalizeSearch(search);
    const filtered = players
      .filter((player) =>
        query ? normalizeSearch(player.name).includes(query) : true
      )
      .sort(sortByName);

    return {
      monthly: filtered.filter((player) => player.type === "MONTHLY"),
      casual: filtered.filter((player) => player.type === "CASUAL"),
    };
  }, [players, search]);

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

  function startEdit(player: Player) {
    setEditing(player);
    setForm({
      name: player.name,
      type: player.type,
      email: player.email || "",
      phone: player.phone || "",
    });
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
        <form className="panel" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>
            {editing ? "Editar jogador" : "Novo jogador"}
          </h2>
          {error ? <div className="error-box">{error}</div> : null}
          <div className="form-grid">
            <div className="field">
              <label>Nome</label>
              <input
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
            placeholder="Ney, Duda, Pedro..."
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
      </div>

      {isLoading ? <p>Carregando...</p> : null}

      <div className="split-lists">
        <PlayerGroup
          title={`Mensalistas (${monthly.length})`}
          players={monthly}
          isAdmin={isAdmin}
          emptyText="Nenhum mensalista encontrado."
          onEdit={startEdit}
          onDeactivate={(id) => deactivateMutation.mutate(id)}
        />
        <PlayerGroup
          title={`Convidados (${casual.length})`}
          players={casual}
          isAdmin={isAdmin}
          emptyText="Nenhum convidado encontrado."
          onEdit={startEdit}
          onDeactivate={(id) => deactivateMutation.mutate(id)}
        />
      </div>
    </div>
  );
}

function PlayerGroup({
  title,
  players,
  isAdmin,
  emptyText,
  onEdit,
  onDeactivate,
}: {
  title: string;
  players: Player[];
  isAdmin: boolean;
  emptyText: string;
  onEdit: (player: Player) => void;
  onDeactivate: (id: string) => void;
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
              {isAdmin ? <th>Ações</th> : null}
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
                </td>
                {isAdmin ? (
                  <td>
                    <div className="actions">
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
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
            {players.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5}>{emptyText}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
