"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { meApi } from "@/lib/services";
import {
  money,
  monthName,
  PAYMENT_STATUS_LABEL,
  PLAYER_TYPE_LABEL,
  paymentStatusClass,
  remainingOf,
  SITUATION_LABEL,
  currentYearMonth,
  formatDateBr,
} from "@/lib/format";

export default function PlayerHomePage() {
  const { year: initialYear, month: initialMonth } = currentYearMonth();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const { data, isLoading, error } = useQuery({
    queryKey: ["me-status", year, month],
    queryFn: () => meApi.status(year, month),
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{data?.player.name || "Você"}</h1>
          <p>
            {data?.player
              ? PLAYER_TYPE_LABEL[data.player.type]
              : "Sua situação no time"}
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
      {isLoading ? <p>Carregando...</p> : null}

      {data ? (
        <>
          <div
            className={`player-status-card ${paymentStatusClass(data.situation)}`}
          >
            <span>{monthName(data.month)} / {data.year}</span>
            <strong>{SITUATION_LABEL[data.situation]}</strong>
          </div>

          <div className="panel" style={{ marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>Mensalidade</h2>
            {data.payment ? (
              <p style={{ marginBottom: 0 }}>
                {money(data.payment.amount)} ·{" "}
                <span className={`badge ${paymentStatusClass(data.payment.status)}`}>
                  {PAYMENT_STATUS_LABEL[data.payment.status]}
                </span>
                {remainingOf(data.payment) > 0
                  ? ` · falta ${money(remainingOf(data.payment))}`
                  : ""}
              </p>
            ) : (
              <p style={{ color: "var(--muted)", marginBottom: 0 }}>
                Sem cobrança neste mês.
              </p>
            )}
          </div>

          {data.month_shares.length > 0 ? (
            <div className="panel" style={{ marginBottom: 16 }}>
              <h2 style={{ marginTop: 0 }}>Rateio deste mês</h2>
              {data.month_shares.map((share) => (
                <p key={share.id} style={{ margin: "0 0 8px" }}>
                  {formatDateBr(share.playedOn)} ·{" "}
                  {money(share.amount)} ·{" "}
                  <span className={`badge ${paymentStatusClass(share.status)}`}>
                    {PAYMENT_STATUS_LABEL[share.status]}
                  </span>
                </p>
              ))}
            </div>
          ) : null}

          {data.open_shares.length > 0 ? (
            <div className="panel" style={{ marginBottom: 16 }}>
              <h2 style={{ marginTop: 0 }}>Em aberto</h2>
              {data.open_shares.map((share) => (
                <p key={share.id} style={{ margin: "0 0 8px" }}>
                  Rateio {formatDateBr(share.playedOn)} ·
                  falta {money(remainingOf(share))}
                </p>
              ))}
            </div>
          ) : null}

          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Meses de {year}</h2>
            <div className="player-months">
              {data.months.map((item) => (
                <button
                  key={item.month}
                  type="button"
                  className={`player-month ${
                    item.month === month ? "selected" : ""
                  }`}
                  onClick={() => setMonth(item.month)}
                >
                  <span>{monthName(item.month).slice(0, 3)}</span>
                  <strong>
                    {item.payment
                      ? PAYMENT_STATUS_LABEL[item.payment.status]
                      : "—"}
                  </strong>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
