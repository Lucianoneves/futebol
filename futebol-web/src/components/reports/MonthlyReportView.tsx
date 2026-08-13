import {
  money,
  PAYMENT_STATUS_LABEL,
  PLAYER_TYPE_LABEL,
  paymentStatusClass,
  playerTypeClass,
} from "@/lib/format";
import type { MonthlyReport } from "@/lib/types";

type ReportRow = {
  player_id?: string;
  name: string;
  type: string;
  amount: number | null;
  paidAmount?: number;
  status: string;
};

type MonthlyReportViewProps = {
  summary: MonthlyReport["summary"] | undefined;
  paid: ReportRow[];
  owing: ReportRow[];
};

export function MonthlyReportView({
  summary,
  paid,
  owing,
}: MonthlyReportViewProps) {
  return (
    <>
      <div className="grid-3">
        <div className="stat-card">
          <span>Total pago no mês</span>
          <strong>{money(summary?.paidTotal ?? 0)}</strong>
        </div>
        <div className="stat-card">
          <span>Em dia</span>
          <strong>{summary?.paidCount ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Em aberto</span>
          <strong>{summary?.owingCount ?? 0}</strong>
        </div>
      </div>

      <div className="split-lists">
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>
            Quem pagou ·{" "}
            {money(
              paid.reduce(
                (sum, item) =>
                  sum + Number(item.paidAmount ?? item.amount ?? 0),
                0
              )
            )}
          </h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Jogador</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {paid.map((item, index) => (
                  <tr
                    key={item.player_id || `${item.name}-paid-${index}`}
                    className={
                      item.type === "CASUAL"
                        ? "report-row-casual"
                        : "report-row-monthly"
                    }
                  >
                    <td>{item.name}</td>
                    <td>
                      <span className={`badge ${playerTypeClass(item.type)}`}>
                        {PLAYER_TYPE_LABEL[item.type] || item.type}
                      </span>
                    </td>
                    <td>{money(item.paidAmount ?? item.amount)}</td>
                  </tr>
                ))}
                {paid.length === 0 ? (
                  <tr>
                    <td colSpan={3}>Nenhum pagamento confirmado.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Quem deve</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Jogador</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {owing.map((item, index) => (
                  <tr
                    key={item.player_id || `${item.name}-owing-${index}`}
                    className={
                      item.type === "CASUAL"
                        ? "report-row-casual"
                        : "report-row-monthly"
                    }
                  >
                    <td>
                      {item.name}
                      {item.type === "CASUAL" ? (
                        <span
                          className="badge casual"
                          style={{ marginLeft: 8 }}
                        >
                          Convidado
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <span className={`badge ${paymentStatusClass(item.status)}`}>
                        {PAYMENT_STATUS_LABEL[item.status] || item.status}
                      </span>
                    </td>
                    <td>{item.amount !== null ? money(item.amount) : "-"}</td>
                  </tr>
                ))}
                {owing.length === 0 ? (
                  <tr>
                    <td colSpan={3}>Ninguém em aberto.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
