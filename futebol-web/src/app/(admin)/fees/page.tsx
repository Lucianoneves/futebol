"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { feesApi } from "@/lib/services";
import { money, PLAYER_TYPE_LABEL } from "@/lib/format";
import type { PlayerType } from "@/lib/types";
import { ApiError } from "@/lib/api";

export default function FeesPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [type, setType] = useState<PlayerType>("MONTHLY");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const { data: fees = [], isLoading } = useQuery({
    queryKey: ["fees"],
    queryFn: feesApi.list,
  });

  const updateMutation = useMutation({
    mutationFn: () => feesApi.update(type, Number(amount)),
    onSuccess: async () => {
      setAmount("");
      await queryClient.invalidateQueries({ queryKey: ["fees"] });
    },
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await updateMutation.mutateAsync();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao atualizar taxa");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Taxas</h1>
          <p>Mensalista e convidado têm valor. Sem taxa (FEES) fica R$ 0 e não gera cobrança.</p>
        </div>
      </div>

      {isAdmin ? (
        <form className="panel" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>Atualizar taxa</h2>
          {error ? <div className="error-box">{error}</div> : null}
          <div className="form-grid">
            <div className="field">
              <label>Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PlayerType)}
              >
                <option value="MONTHLY">{PLAYER_TYPE_LABEL.MONTHLY}</option>
                <option value="CASUAL">{PLAYER_TYPE_LABEL.CASUAL}</option>
              </select>
            </div>
            <div className="field">
              <label>Valor</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>
          <button className="btn" type="submit">
            Salvar taxa
          </button>
        </form>
      ) : null}

      <div className="panel">
        {isLoading ? <p>Carregando...</p> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Atualizado em</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => (
                <tr key={fee.id}>
                  <td>{PLAYER_TYPE_LABEL[fee.type] || fee.type}</td>
                  <td>
                    {fee.type === "FEES"
                      ? "Sem cobrança"
                      : money(fee.amount)}
                  </td>
                  <td>
                    {new Date(fee.updatedAt).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
