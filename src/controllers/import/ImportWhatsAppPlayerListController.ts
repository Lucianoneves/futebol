import { Request, Response } from "express";
import { ImportWhatsAppPlayerListService } from "../../services/import/ImportWhatsAppPlayerListService";

class ImportWhatsAppPlayerListController {
  async handle(request: Request, response: Response) {
    const { text, year, month, apply } = request.body;

    const importWhatsAppPlayerListService = new ImportWhatsAppPlayerListService();

    const result = await importWhatsAppPlayerListService.execute({
      text,
      year: Number(year),
      month: Number(month),
      apply: Boolean(apply),
    });

    return response.json(result);
  }
}

export { ImportWhatsAppPlayerListController };
