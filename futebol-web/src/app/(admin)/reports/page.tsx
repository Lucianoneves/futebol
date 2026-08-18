"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { dashboardApi, reportsApi } from "@/lib/services";
import {
  currentYearMonth,
  filterSortByName,
  money,
  NAME_SEARCH_PLACEHOLDER,
} from "@/lib/format";
import {
  copyReportImageWithFallback,
  renderReportPng,
  reportFromMonthly,
  reportImageFilename,
} from "@/lib/reportImage";
import { downloadExcelReport, downloadPdfReport } from "@/lib/exportReport";
import { MonthlyReportView } from "@/components/reports/MonthlyReportView";
import {
  copyPublicReportLink,
  sendPublicReportWhatsApp,
} from "@/lib/shareReport";

export default function ReportsPage() {
  const { isAdmin } = useAuth();
  const { year: initialYear, month: initialMonth } = currentYearMonth();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [search, setSearch] = useState("");
  const [info, setInfo] = useState("");
  const [copyError, setCopyError] = useState("");
  const [sharing, setSharing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["report-monthly", year, month],
    queryFn: () => reportsApi.monthly(year, month),
  });

  const { data: finance } = useQuery({
    queryKey: ["dashboard", year, month],
    queryFn: () => dashboardApi.balance(year, month),
  });

  const paid = filterSortByName(data?.paid ?? [], search, (item) => item.name);
  const owing = filterSortByName(data?.owing ?? [], search, (item) => item.name);

  async function handleCopyLink() {
    setSharing(true);
    try {
      setInfo(await copyPublicReportLink(year, month));
      setCopyError("");
    } catch {
      setCopyError("Não foi possível copiar o link.");
    } finally {
      setSharing(false);
    }
  }

  async function handleSendWhatsApp() {
    setSharing(true);
    try {
      setInfo(await sendPublicReportWhatsApp(year, month));
      setCopyError("");
    } catch {
      setCopyError("Não foi possível gerar o link do relatório.");
    } finally {
      setSharing(false);
    }
  }

  function handleDownloadExcel() {
    if (!data || !finance) return;
    try {
      downloadExcelReport({ report: data, finance });
      setInfo("Excel baixado.");
      setCopyError("");
    } catch {
      setCopyError("Não foi possível gerar o Excel.");
    }
  }

  function handleDownloadPdf() {
    if (!data || !finance) return;
    try {
      downloadPdfReport({ report: data, finance });
      setInfo("Na janela que abrir, escolha Salvar como PDF.");
      setCopyError("");
    } catch (err) {
      setCopyError(
        err instanceof Error ? err.message : "Não foi possível gerar o PDF."
      );
    }
  }

  async function handleCopyImage() {
    if (!data) return;
    setSharing(true);
    const report = reportFromMonthly(data);
    const result = await copyReportImageWithFallback(
      () => renderReportPng(report),
      reportImageFilename(report)
    );
    if (result.ok) {
      setInfo(result.message);
      setCopyError("");
    } else {
      setCopyError(result.message);
    }
    setSharing(false);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Relatórios</h1>
          {!isAdmin ? (
            <span className="consult-badge">Somente consulta</span>
          ) : null}
          <p>Quem pagou e Em haver no mês · Excel e PDF com arrecadação, despesas e saldo</p>
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
        <div className="field">
          <label>Buscar pelo nome</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={NAME_SEARCH_PLACEHOLDER}
          />
        </div>
        <button
          className="btn-secondary"
          type="button"
          onClick={handleCopyLink}
          disabled={!data || sharing}
        >
          Copiar link
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={handleSendWhatsApp}
          disabled={!data || sharing}
        >
          Enviar no WhatsApp
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={handleCopyImage}
          disabled={!data || sharing}
        >
          {sharing ? "Gerando..." : "Copiar imagem"}
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={handleDownloadExcel}
          disabled={!data || !finance}
        >
          Baixar Excel
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={handleDownloadPdf}
          disabled={!data || !finance}
        >
          Baixar PDF
        </button>
      </div>

      {error ? (
        <div className="error-box">{(error as Error).message}</div>
      ) : null}
      {copyError ? <div className="error-box">{copyError}</div> : null}
      {info ? (
        <p style={{ color: "var(--ok)", fontWeight: 600, marginTop: 0 }}>
          {info}
        </p>
      ) : null}

      {isLoading ? <p>Carregando...</p> : null}

      {finance?.prepaid ? (
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Adiantado para o próximo mês (não entra nas receitas vigentes):{" "}
          <strong>{money(finance.prepaid)}</strong>
          {" · "}
          Valor em caixa deste  mês:{" "}
          <strong
            style={{
              color:
                (finance.monthBalance ?? 0) < 0
                  ? "var(--danger)"
                  : "var(--ok)",
            }}
          >
            {money(finance.monthBalance ?? 0)}
          </strong>
        </p>
      ) : finance ? (
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Resultado deste mês (receitas − despesas):{" "}
          <strong
            style={{
              color:
                (finance.monthBalance ?? 0) < 0
                  ? "var(--danger)"
                  : "var(--ok)",
            }}
          >
            {money(finance.monthBalance ?? 0)}
          </strong>
        </p>
      ) : null}

      <MonthlyReportView summary={data?.summary} paid={paid} owing={owing} />
    </div>
  );
}
