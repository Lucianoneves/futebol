"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { expensesApi } from "@/lib/services";
import { formatDateBr, money, monthName, currentYearMonth } from "@/lib/format";

export default function PlayerExpensesPage() {
  const { year: initialYear, month: initialMonth } = currentYearMonth();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ["player-expenses", year, month],
    queryFn: () => expensesApi.list({ year, month }),
  });

  const total = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Despesas do time</h1>
          <p>Só consulta. Quem lança é a gestão.</p>
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

      <div className="stat-card" style={{ marginBottom: 16 }}>
        <span>Total de {monthName(month)}</span>
        <strong>{money(total)}</strong>
      </div>

      {error ? (
        <div className="error-box">{(error as Error).message}</div>
      ) : null}

      <div className="panel">
        {isLoading ? <p>Carregando...</p> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Data</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.expenseType?.name || expense.description}</td>
                  <td>{formatDateBr(expense.spentAt)}</td>
                  <td>{money(expense.amount)}</td>
                </tr>
              ))}
              {!isLoading && expenses.length === 0 ? (
                <tr>
                  <td colSpan={3}>Nenhuma despesa neste mês.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
