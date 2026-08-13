"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/services";
import { money, currentYearMonth, formatDateBr, transactionTypeClass, transactionTypeLabel } from "@/lib/format";

export default function DashboardPage() {
  const { year: initialYear, month: initialMonth } = currentYearMonth();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", year, month],
    queryFn: () => dashboardApi.balance(year, month),
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Receitas do mês vigente (sem adiantamento do mês seguinte), despesas
            do mês e saldo restante para os próximos meses
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="field">
          <label>Ano</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
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
          />
        </div>
      </div>

      {error ? (
        <div className="error-box">{(error as Error).message}</div>
      ) : null}

      <div className="grid-3">
        <div className="stat-card">
          <span>Receitas do mês vigente</span>
          <strong>{money(data?.income ?? 0)}</strong>
        </div>
        <div className="stat-card">
          <span>Despesas do mês</span>
          <strong>{money(data?.outcome ?? 0)}</strong>
        </div>
        <div className="stat-card">
          <span>Saldo restante (próximos meses)</span>
          <strong
            style={{
              color:
                (data?.remaining ?? data?.balance ?? 0) < 0
                  ? "var(--danger)"
                  : "var(--ok)",
            }}
          >
            {money(data?.remaining ?? data?.balance ?? 0)}
          </strong>
        </div>
      </div>

      {data?.prepaid ? (
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Adiantado para o próximo mês (não entra nas receitas vigentes):{" "}
          <strong>{money(data.prepaid)}</strong>
          {" · "}
          Resultado deste mês: {money(data.monthBalance ?? 0)}
        </p>
      ) : (
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Resultado deste mês (receitas − despesas):{" "}
          <strong>{money(data?.monthBalance ?? 0)}</strong>
        </p>
      )}

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Movimentações</h2>
        {isLoading ? <p>Carregando...</p> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {(data?.transactions ?? []).map((item) => (
                <tr key={item.id}>
                  <td>{formatDateBr(String(item.date))}</td>
                  <td>
                    <span className={`badge ${transactionTypeClass(item.type)}`}>
                      {transactionTypeLabel(item.type)}
                    </span>
                  </td>
                  <td>{item.description}</td>
                  <td>{money(item.amount)}</td>
                </tr>
              ))}
              {!isLoading && (data?.transactions?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={4}>Nenhuma movimentação neste período.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
