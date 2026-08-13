"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/services";
import { normalizeSearch, sortByPtName } from "@/lib/format";
import {
  copyPngToClipboard,
  downloadPng,
  renderReportPng,
  reportFromMonthly,
  reportImageFilename,
} from "@/lib/reportImage";
import { MonthlyReportView } from "@/components/reports/MonthlyReportView";
import {
  isLocalShareUrl,
  openWhatsApp,
  publicReportUrl,
  whatsAppReportLinkText,
} from "@/lib/shareReport";

export default function ReportsPage() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [search, setSearch] = useState("");
  const [info, setInfo] = useState("");
  const [copyError, setCopyError] = useState("");
  const [sharing, setSharing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["report-monthly", year, month],
    queryFn: () => reportsApi.monthly(year, month),
  });

  const query = normalizeSearch(search);
  const paid = [...(data?.paid ?? [])]
    .filter((item) =>
      query ? normalizeSearch(item.name).includes(query) : true
    )
    .sort((left, right) => sortByPtName(left.name, right.name));
  const owing = [...(data?.owing ?? [])]
    .filter((item) =>
      query ? normalizeSearch(item.name).includes(query) : true
    )
    .sort((left, right) => sortByPtName(left.name, right.name));

  async function shareImage() {
    if (!data) throw new Error("Relatório ainda não carregou");
    return renderReportPng(reportFromMonthly(data));
  }

  async function resolveShareUrl() {
    const share = await reportsApi.share(year, month);
    return publicReportUrl(share.year, share.month, share.token);
  }

  function shareSuccessMessage(url: string, copied: boolean) {
    const local = isLocalShareUrl(url)
      ? " No celular do grupo, publique o painel ou abra pelo IP da rede — localhost não abre fora deste computador."
      : "";
    return copied
      ? `Link copiado.${local}`
      : `WhatsApp aberto com o link.${local}`;
  }

  async function handleCopyLink() {
    setSharing(true);
    try {
      const url = await resolveShareUrl();
      await navigator.clipboard.writeText(url);
      setInfo(shareSuccessMessage(url, true));
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
      const url = await resolveShareUrl();
      openWhatsApp(whatsAppReportLinkText(year, month, url));
      setInfo(shareSuccessMessage(url, false));
      setCopyError("");
    } catch {
      setCopyError("Não foi possível gerar o link do relatório.");
    } finally {
      setSharing(false);
    }
  }

  async function handleCopyImage() {
    if (!data) return;
    setSharing(true);
    try {
      const blob = await shareImage();
      await copyPngToClipboard(blob);
      setInfo("Imagem copiada. Cole no WhatsApp (Ctrl+V).");
      setCopyError("");
    } catch {
      try {
        const blob = await shareImage();
        downloadPng(blob, reportImageFilename(reportFromMonthly(data)));
        setInfo("Não deu para copiar. A imagem foi baixada para você anexar no WhatsApp.");
        setCopyError("");
      } catch {
        setCopyError("Não foi possível gerar a imagem do relatório.");
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Relatórios</h1>
          <p>Quem pagou e quem deve no mês</p>
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
            placeholder="Ney, Duda, Pedro..."
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

      <MonthlyReportView summary={data?.summary} paid={paid} owing={owing} />
    </div>
  );
}
