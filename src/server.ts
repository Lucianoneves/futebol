import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import "express-async-errors";
import cors from "cors";
import { router } from "./routes";

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

app.listen(3003, () => console.log("Server  online Ok  3003"));
