import { Request, Response } from "express";
import { MonthlyReportService } from "../../services/report/MonthlyReportService";

class MonthlyReportController {
  async handle(request: Request, response: Response) {
    const year = Number(request.query.year);
    const month = Number(request.query.month);

    const monthlyReportService = new MonthlyReportService();

    const report = await monthlyReportService.execute({ year, month });

    return response.json(report);
  }
}

export { MonthlyReportController };
