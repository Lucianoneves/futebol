import { MonthlyReportService } from "./MonthlyReportService";

interface PublicMonthlyReportRequest {
  year: number;
  month: number;
}

function publicRow(item: {
  name: string;
  type: string;
  amount: number | null;
  paidAmount: number;
  status: string;
}) {
  return {
    name: item.name,
    type: item.type,
    amount: item.amount,
    paidAmount: item.paidAmount,
    status: item.status,
  };
}

class PublicMonthlyReportService {
  async execute({ year, month }: PublicMonthlyReportRequest) {
    const monthlyReportService = new MonthlyReportService();
    const report = await monthlyReportService.execute({ year, month });

    return {
      year: report.year,
      month: report.month,
      summary: report.summary,
      paid: report.paid.map(publicRow),
      owing: report.owing.map(publicRow),
    };
  }
}

export { PublicMonthlyReportService };
