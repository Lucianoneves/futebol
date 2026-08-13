import { Request, Response } from "express";
import { PublicMonthlyReportService } from "../../services/report/PublicMonthlyReportService";
import { isValidReportShareToken } from "../../utils/reportShareToken";

class PublicMonthlyReportController {
  async handle(request: Request, response: Response) {
    const year = Number(request.query.year);
    const month = Number(request.query.month);
    const token = String(request.query.token || "");

    if (!isValidReportShareToken(year, month, token)) {
      throw new Error("Link inválido");
    }

    const publicMonthlyReportService = new PublicMonthlyReportService();
    const report = await publicMonthlyReportService.execute({ year, month });

    return response.json(report);
  }
}

export { PublicMonthlyReportController };
