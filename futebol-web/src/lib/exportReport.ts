import {
  formatDateBr,
  money,
  monthName,
  PAYMENT_STATUS_LABEL,
  PLAYER_TYPE_LABEL,
  transactionTypeLabel,
} from "./format";
import type { BalanceDashboard, MonthlyReport } from "./types";

export type ExportReportData = {
  report: MonthlyReport;
  finance: BalanceDashboard;
};

export function exportFilename(year: number, month: number, ext: string) {
  return `relatorio-${monthName(month)}-${year}.${ext}`;
}

export function downloadExcelReport(data: ExportReportData) {
  const xml = buildExcelXml(data);
  downloadBlob(
    new Blob(["\uFEFF" + xml], { type: "application/vnd.ms-excel;charset=utf-8" }),
    exportFilename(data.report.year, data.report.month, "xls")
  );
}

export function downloadPdfReport(data: ExportReportData) {
  const html = buildPrintHtml(data);
  const popup = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!popup) {
    throw new Error("Permita pop-ups para gerar o PDF.");
  }
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}

function buildExcelXml({ report, finance }: ExportReportData) {
  const title = `Relatório ${monthName(report.month)}/${report.year}`;
  const rows: string[] = [
    xmlRow(["FUTEBOL", title]),
    xmlRow([]),
    xmlRow(["Resumo"]),
    xmlRow(["Arrecadação do mês", finance.income]),
    xmlRow(["Despesas do mês", finance.outcome]),
    xmlRow(["Resultado do mês", finance.monthBalance ?? finance.income - finance.outcome]),
    xmlRow(["Adiantado (próximo mês)", finance.prepaid ?? 0]),
    xmlRow(["Saldo restante", finance.remaining ?? finance.balance]),
    xmlRow([]),
    xmlRow(["Quem pagou"]),
    xmlRow(["Jogador", "Tipo", "Valor"]),
    ...report.paid.map((item) =>
      xmlRow([
        item.name,
        PLAYER_TYPE_LABEL[item.type] || item.type,
        Number(item.paidAmount ?? item.amount ?? 0),
      ])
    ),
    xmlRow([]),
    xmlRow(["Quem deve"]),
    xmlRow(["Jogador", "Tipo", "Status", "Valor"]),
    ...report.owing.map((item) =>
      xmlRow([
        item.name,
        PLAYER_TYPE_LABEL[item.type] || item.type,
        PAYMENT_STATUS_LABEL[item.status] || item.status,
        item.amount ?? 0,
      ])
    ),
    xmlRow([]),
    xmlRow(["Movimentações"]),
    xmlRow(["Data", "Tipo", "Descrição", "Valor"]),
    ...finance.transactions.map((item) =>
      xmlRow([
        formatDateBr(String(item.date)),
        transactionTypeLabel(item.type),
        item.description,
        item.amount,
      ])
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Relatorio">
  <Table>${rows.join("")}</Table>
 </Worksheet>
</Workbook>`;
}

function xmlRow(values: Array<string | number>) {
  if (values.length === 0) {
    return "<Row></Row>";
  }
  const cells = values
    .map((value) => {
      if (typeof value === "number") {
        return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
      }
      return `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
    })
    .join("");
  return `<Row>${cells}</Row>`;
}

function escapeXml(value: string) {
  return escapeMarkup(value, true);
}

function esc(value: string) {
  return escapeMarkup(value);
}

function escapeMarkup(value: string, quotes = false) {
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return quotes ? escaped.replace(/"/g, "&quot;") : escaped;
}

function buildPrintHtml({ report, finance }: ExportReportData) {
  const title = `Relatório ${monthName(report.month)}/${report.year}`;
  const paidRows = report.paid
    .map(
      (item) =>
        `<tr class="${item.type === "CASUAL" ? "casual" : ""}"><td>${esc(item.name)}</td><td>${esc(PLAYER_TYPE_LABEL[item.type] || item.type)}</td><td>${money(item.paidAmount ?? item.amount)}</td></tr>`
    )
    .join("");
  const owingRows = report.owing
    .map(
      (item) =>
        `<tr class="${item.type === "CASUAL" ? "casual" : ""}"><td>${esc(item.name)}</td><td>${esc(PLAYER_TYPE_LABEL[item.type] || item.type)}</td><td>${esc(PAYMENT_STATUS_LABEL[item.status] || item.status)}</td><td>${item.amount !== null ? money(item.amount) : "-"}</td></tr>`
    )
    .join("");
  const moveRows = finance.transactions
    .map(
      (item) =>
        `<tr><td>${esc(formatDateBr(String(item.date)))}</td><td>${esc(transactionTypeLabel(item.type))}</td><td>${esc(item.description)}</td><td>${money(item.amount)}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>
    body { font-family: Segoe UI, sans-serif; color: #13261a; margin: 24px; }
    h1 { color: #134829; margin-bottom: 4px; }
    h2 { color: #1f6b3a; margin-top: 28px; }
    .muted { color: #4d6556; }
    .cards { display: flex; gap: 12px; flex-wrap: wrap; margin: 16px 0 8px; }
    .card { border: 1px solid #c5d6c9; border-radius: 12px; padding: 12px 16px; min-width: 160px; }
    .card span { display: block; color: #4d6556; font-size: 13px; }
    .card strong { font-size: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #c5d6c9; }
    th { color: #4d6556; font-size: 13px; }
    tr.casual { background: rgba(212, 160, 23, 0.14); }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <button onclick="window.print()">Salvar como PDF</button>
  <h1>FUTEBOL</h1>
  <p class="muted">${esc(title)} · Arrecadação, despesas e saldo</p>
  <div class="cards">
    <div class="card"><span>Arrecadação do mês</span><strong>${money(finance.income)}</strong></div>
    <div class="card"><span>Despesas do mês</span><strong>${money(finance.outcome)}</strong></div>
    <div class="card"><span>Resultado do mês</span><strong>${money(finance.monthBalance ?? finance.income - finance.outcome)}</strong></div>
    <div class="card"><span>Saldo restante</span><strong>${money(finance.remaining ?? finance.balance)}</strong></div>
  </div>
  <p class="muted">Adiantado para o próximo mês (não entra na arrecadação vigente): ${money(finance.prepaid ?? 0)}</p>
  <h2>Quem pagou</h2>
  <table><thead><tr><th>Jogador</th><th>Tipo</th><th>Valor</th></tr></thead>
  <tbody>${paidRows || `<tr><td colspan="3">Nenhum pagamento confirmado.</td></tr>`}</tbody></table>
  <h2>Quem deve</h2>
  <table><thead><tr><th>Jogador</th><th>Tipo</th><th>Status</th><th>Valor</th></tr></thead>
  <tbody>${owingRows || `<tr><td colspan="4">Ninguém em aberto.</td></tr>`}</tbody></table>
  <h2>Movimentações</h2>
  <table><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Valor</th></tr></thead>
  <tbody>${moveRows || `<tr><td colspan="4">Nenhuma movimentação neste período.</td></tr>`}</tbody></table>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
