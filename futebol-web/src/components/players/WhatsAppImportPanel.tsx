"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { playersApi } from "@/lib/services";
import { money, PLAYER_TYPE_LABEL } from "@/lib/format";
import { ApiError } from "@/lib/api";
import type { WhatsAppImportResult, WhatsAppImportRow } from "@/lib/types";

function playerActionLabel(action: WhatsAppImportRow["player_action"]) {
  if (action === "create_player") return "Cadastrar";
  if (action === "reactivate_player") return "Reativar";
  return "Já existe";
}

function paymentActionLabel(row: WhatsAppImportRow) {
  if (row.payment_action === "pay_months") {
    return `Pagar ${row.months_to_pay} meses`;
  }
  if (row.payment_action === "mark_paid") return "Marcar pago";
  if (row.payment_action === "already_paid") return "Já pago";
  if (row.payment_action === "create_pending") return "Gerar pendente";
  return "-";
}

export function WhatsAppImportPanel() {
  const queryClient = useQueryClient();
  const now = useMemo(() => new Date(), []);
  const [text, setText] = useState("");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [error, setError] = useState("");
  const [result, setResult] = useState<WhatsAppImportResult | null>(null);

  const previewMutation = useMutation({
    mutationFn: () =>
      playersApi.importWhatsApp({ text, year, month, apply: false }),
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      playersApi.importWhatsApp({ text, year, month, apply: true }),
    onSuccess: async (data) => {
      setResult(data);
      await queryClient.invalidateQueries({ queryKey: ["players"] });
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  async function handlePreview(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await previewMutation.mutateAsync();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao ler a lista do WhatsApp"
      );
    }
  }

  async function handleApply() {
    setError("");
    try {
      await applyMutation.mutateAsync();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao importar a lista"
      );
    }
  }

  return (
    <form className="panel" onSubmit={handlePreview} style={{ marginBottom: 20 }}>
      <h2 style={{ marginTop: 0 }}>Colar lista do WhatsApp</h2>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>
        Copie a lista do grupo, cole aqui e escolha o mês. Quem tiver valor e ✅
        entra como pago. Quem não pagou é cadastrado e fica pendente.
      </p>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="form-grid">
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
      </div>
      <div className="field" style={{ marginBottom: 16 }}>
        <label>Lista</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={`7 Ney 40 ✅\n8 Serildo 40 ✅\n10 Barto\nLista de pagamento por jogo 15$\nDuda. 15 ✅`}
          required
        />
      </div>
      <div className="actions">
        <button className="btn" type="submit">
          {previewMutation.isPending ? "Lendo..." : "Pré-visualizar"}
        </button>
        {result && !result.apply ? (
          <button
            className="btn-secondary"
            type="button"
            onClick={handleApply}
            disabled={applyMutation.isPending}
          >
            {applyMutation.isPending ? "Importando..." : "Cadastrar e atualizar pagamentos"}
          </button>
        ) : null}
      </div>

      {result ? (
        <div style={{ marginTop: 20 }}>
          <p>
            {result.apply ? "Importado:" : "Prévia:"} {result.total} nomes ·{" "}
            {result.summary.create_player} novos ·{" "}
            {result.summary.existing_player} já cadastrados ·{" "}
            {result.summary.mark_paid} pagos · {result.summary.pending}{" "}
            pendentes
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Jogador</th>
                  <th>Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.raw + row.name}>
                    <td>{row.name}</td>
                    <td>{PLAYER_TYPE_LABEL[row.type] || row.type}</td>
                    <td>{row.amount ? money(row.amount) : "-"}</td>
                    <td>{playerActionLabel(row.player_action)}</td>
                    <td>{paymentActionLabel(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </form>
  );
}
