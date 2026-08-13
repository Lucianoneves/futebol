import { reportShareToken } from "../../utils/reportShareToken";
import { assertYearMonth } from "../../utils/date";

interface ShareMonthlyReportRequest {
  year: number;
  month: number;
}

class ShareMonthlyReportService {
  async execute({ year, month }: ShareMonthlyReportRequest) {
    assertYearMonth(year, month);

    return {
      year,
      month,
      token: reportShareToken(year, month),
    };
  }
}

export { ShareMonthlyReportService };
