import { Request, Response } from "express";
import { BalanceDashboardService } from "../../services/dashboard/BalanceDashboardService";

class BalanceDashboardController {
  async handle(request: Request, response: Response) {
    const year = request.query.year
      ? Number(request.query.year)
      : undefined;
    const month = request.query.month
      ? Number(request.query.month)
      : undefined;

    const balanceDashboardService = new BalanceDashboardService();

    const dashboard = await balanceDashboardService.execute({ year, month });

    return response.json(dashboard);
  }
}

export { BalanceDashboardController };
