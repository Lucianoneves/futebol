"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/services";
import { money } from "@/lib/format";

export default function DashboardPage() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", year, month],
    queryFn: () => dashboardApi.balance(year, month),
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Saldo do time (receitas − despesas)</p>
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
          <span>Receitas</span>
          <strong>{money(data?.income ?? 0)}</strong>
        </div>
        <div className="stat-card">
          <span>Despesas</span>
          <strong>{money(data?.outcome ?? 0)}</strong>
        </div>
        <div className="stat-card">
          <span>Saldo</span>
          <strong>{money(data?.balance ?? 0)}</strong>
        </div>
      </div>

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
                  <td>{new Date(item.date).toLocaleDateString("pt-BR")}</td>
                  <td>
                    <span
                      className={`badge ${item.type === "INCOME" ? "ok" : "danger"}`}
                    >
                      {item.type === "INCOME" ? "Receita" : "Despesa"}
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
