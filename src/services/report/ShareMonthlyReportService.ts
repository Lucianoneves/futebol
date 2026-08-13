import { reportShareToken } from "../../utils/reportShareToken";

interface ShareMonthlyReportRequest {
  year: number;
  month: number;
}

class ShareMonthlyReportService {
  async execute({ year, month }: ShareMonthlyReportRequest) {
    if (!year || !month) {
      throw new Error("Ano e mês são obrigatórios");
    }

    if (month < 1 || month > 12) {
      throw new Error("Mês deve ser entre 1 e 12");
    }

    return {
      year,
      month,
      token: reportShareToken(year, month),
    };
  }
}

export { ShareMonthlyReportService };
