"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { expensesApi, expenseTypesApi } from "@/lib/services";
import { formatDateBr, money, toApiDate, toDateInputValue } from "@/lib/format";
import type { Expense } from "@/lib/types";
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
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [error, setError] = useState("");

  const { data: expenseTypes = [] } = useQuery({
    queryKey: ["expense-types"],
    queryFn: expenseTypesApi.list,
  });

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => expensesApi.list(),
  });

  const total = useMemo(
    () =>
      expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  );

  useEffect(() => {
    if (!form.expense_type_id && expenseTypes[0]) {
      setForm((prev) => ({ ...prev, expense_type_id: expenseTypes[0].id }));
    }
  }, [expenseTypes, form.expense_type_id]);

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
    },
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await saveMutation.mutateAsync();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar item");
    }
  }

  async function handleCreateType(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await createTypeMutation.mutateAsync(newTypeName);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao criar tipo de despesa"
      );
    }
  }

  function startEdit(expense: Expense) {
    setEditing(expense);
    setForm({
      expense_type_id: expense.expenseTypeId || expense.expenseType?.id || "",
      amount: String(expense.amount),
      spentAt: toDateInputValue(expense.spentAt),
    });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Despesas</h1>
          <p>Selecione o tipo, some os itens e acompanhe o total</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <span>Itens na lista</span>
          <strong>{expenses.length}</strong>
        </div>
        <div className="stat-card">
          <span>Total das despesas</span>
          <strong>{money(total)}</strong>
        </div>
        <div className="stat-card">
          <span>Data</span>
          <strong>{formatDateBr(form.spentAt)}</strong>
        </div>
      </div>

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
          {error ? <div className="error-box">{error}</div> : null}
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
                onChange={(e) => setForm({ ...form, spentAt: e.target.value })}
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
                    spentAt: prev.spentAt,
                  }));
                }}
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="panel">
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
          <h2 style={{ margin: 0 }}>Lista de despesas</h2>
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
                    Nenhum item ainda. Some um tipo e um valor na lista.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
