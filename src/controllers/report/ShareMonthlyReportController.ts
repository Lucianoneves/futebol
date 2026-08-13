import { Request, Response } from "express";
import { ShareMonthlyReportService } from "../../services/report/ShareMonthlyReportService";

class ShareMonthlyReportController {
  async handle(request: Request, response: Response) {
    const year = Number(request.query.year);
    const month = Number(request.query.month);

    const shareMonthlyReportService = new ShareMonthlyReportService();
    const share = await shareMonthlyReportService.execute({ year, month });

    return response.json(share);
  }
}

export { ShareMonthlyReportController };
