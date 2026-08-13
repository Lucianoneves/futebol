import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import "express-async-errors";
import cors from "cors";
import { router } from "./routes";
import { ApplyOverduePaymentsService } from "./services/payment/ApplyOverduePaymentsService";

const app = express();

app.use(express.json());
app.use(cors());
app.use(router);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof Error) {
    return res.status(400).json({
      error: err.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
});

async function applyOverdueJob() {
  try {
    const result = await new ApplyOverduePaymentsService().execute();
    if (result.updated > 0) {
      console.log(`Cobranças marcadas como atrasadas: ${result.updated}`);
    }
  } catch (error) {
    console.error("Falha ao marcar atrasos:", error);
  }
}

app.listen(3003, () => {
  console.log("Server  online Ok  3003");
  applyOverdueJob();
  setInterval(applyOverdueJob, 60 * 60 * 1000);
});
