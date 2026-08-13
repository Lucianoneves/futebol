"use client";

import { useQuery } from "@tanstack/react-query";
import { meApi } from "@/lib/services";
import {
  formatDateBr,
  money,
  PAYMENT_STATUS_LABEL,
  paymentStatusClass,
  remainingOf,
} from "@/lib/format";

export default function PlayerMatchesPage() {
  const { data: shares = [], isLoading, error } = useQuery({
    queryKey: ["me-shares"],
    queryFn: meApi.shares,
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Peladas</h1>
          <p>Seu rateio nos jogos em que você entrou.</p>
        </div>
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
                <th>Dia</th>
                <th>Sua parte</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shares.map((share) => (
                <tr key={share.id}>
                  <td>{formatDateBr(share.playedOn)}</td>
                  <td>
                    {money(share.amount)}
                    {remainingOf(share) > 0 && share.status !== "PAID"
                      ? ` · falta ${money(remainingOf(share))}`
                      : ""}
                  </td>
                  <td>
                    <span className={`badge ${paymentStatusClass(share.status)}`}>
                      {PAYMENT_STATUS_LABEL[share.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {!isLoading && shares.length === 0 ? (
                <tr>
                  <td colSpan={3}>Nenhum rateio ainda.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
