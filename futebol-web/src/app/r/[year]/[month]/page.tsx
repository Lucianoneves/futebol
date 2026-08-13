"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/services";
import { monthName, normalizeSearch, sortByPtName } from "@/lib/format";
import { MonthlyReportView } from "@/components/reports/MonthlyReportView";

export default function PublicReportPage() {
  const params = useParams<{ year: string; month: string }>();
  const searchParams = useSearchParams();
  const year = Number(params?.year);
  const month = Number(params?.month);
  const token = searchParams?.get("t") || "";
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-report-monthly", year, month, token],
    queryFn: () => reportsApi.publicMonthly(year, month, token),
    enabled: Number.isInteger(year) && Number.isInteger(month) && token.length > 0,
  });

  const query = normalizeSearch(search);
  const paid = useMemo(
    () =>
      [...(data?.paid ?? [])]
        .filter((item) =>
          query ? normalizeSearch(item.name).includes(query) : true
        )
        .sort((left, right) => sortByPtName(left.name, right.name)),
    [data?.paid, query]
  );
  const owing = useMemo(
    () =>
      [...(data?.owing ?? [])]
        .filter((item) =>
          query ? normalizeSearch(item.name).includes(query) : true
        )
        .sort((left, right) => sortByPtName(left.name, right.name)),
    [data?.owing, query]
  );

  const invalidLink = !token || !Number.isInteger(year) || !Number.isInteger(month);

  return (
    <div className="public-report">
      <header className="public-report-brand">
        <p className="brand">FUTEBOL</p>
        <p>Relatório do time</p>
        <span className="consult-badge">Somente consulta</span>
      </header>

      <div className="page-header">
        <div>
          <h1>Relatórios</h1>
          <p>
            Quem pagou e quem deve no mês
            {Number.isInteger(month) && Number.isInteger(year)
              ? ` · ${monthName(month)}/${year}`
              : ""}
            . Só o administrador pode alterar pagamentos e cadastros.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="field">
          <label>Buscar pelo nome</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ney, Duda, Pedro..."
          />
        </div>
      </div>

      {invalidLink ? (
        <div className="error-box">Este link está incompleto. Peça o link de novo no grupo.</div>
      ) : null}
      {error ? (
        <div className="error-box">{(error as Error).message}</div>
      ) : null}
      {isLoading ? <p>Carregando...</p> : null}

      {!invalidLink && !error ? (
        <MonthlyReportView summary={data?.summary} paid={paid} owing={owing} />
      ) : null}
    </div>
  );
}
