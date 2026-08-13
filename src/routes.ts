import { Router } from "express";
import { CreateUserController } from "./controllers/user/CreateUserController";
import { AuthUserController } from "./controllers/user/AuthUserController";
import { DetailUserController } from "./controllers/user/DetailUserController";
import { isAuthenticated } from "./middlewares/isAuthenticated";
import { isAdmin } from "./middlewares/isAdmin";
import { validate } from "./middlewares/validate";
import { UpdateUserController } from "./controllers/user/UpdateUserController";
import { CreatePlayerController } from "./controllers/player/CreatePlayerController";
import { ListPlayerController } from "./controllers/player/ListPlayerController";
import { DetailPlayerController } from "./controllers/player/DetailPlayerController";
import { UpdatePlayerController } from "./controllers/player/UpdatePlayerController";
import { DeactivatePlayerController } from "./controllers/player/DeactivatePlayerController";
import { ImportWhatsAppPlayerListController } from "./controllers/import/ImportWhatsAppPlayerListController";
import { CreatePaymentController } from "./controllers/payment/CreatePaymentController";
import { GenerateMonthlyPaymentsController } from "./controllers/payment/GenerateMonthlyPaymentsController";
import { ListPaymentController } from "./controllers/payment/ListPaymentController";
import { DetailPaymentController } from "./controllers/payment/DetailPaymentController";
import { UpdatePaymentController } from "./controllers/payment/UpdatePaymentController";
import { MarkPaymentPaidController } from "./controllers/payment/MarkPaymentPaidController";
import { MarkPaymentOverdueController } from "./controllers/payment/MarkPaymentOverdueController";
import { CancelPaymentController } from "./controllers/payment/CancelPaymentController";
import { AddPaymentValueController } from "./controllers/payment/AddPaymentValueController";
import { CreateExpenseController } from "./controllers/expense/CreateExpenseController";
import { ListExpenseController } from "./controllers/expense/ListExpenseController";
import { DetailExpenseController } from "./controllers/expense/DetailExpenseController";
import { UpdateExpenseController } from "./controllers/expense/UpdateExpenseController";
import { DeleteExpenseController } from "./controllers/expense/DeleteExpenseController";
import { ListExpenseTypeController } from "./controllers/expenseType/ListExpenseTypeController";
import { CreateExpenseTypeController } from "./controllers/expenseType/CreateExpenseTypeController";
import { ListFeeSettingController } from "./controllers/fee/ListFeeSettingController";
import { UpdateFeeSettingController } from "./controllers/fee/UpdateFeeSettingController";
import { MonthlyReportController } from "./controllers/report/MonthlyReportController";
import { ShareMonthlyReportController } from "./controllers/report/ShareMonthlyReportController";
import { PublicMonthlyReportController } from "./controllers/report/PublicMonthlyReportController";
import { BalanceDashboardController } from "./controllers/dashboard/BalanceDashboardController";
import {
  authUserSchema,
  createUserSchema,
  updateUserSchema,
} from "./schemas/user.schemas";
import {
  createPlayerSchema,
  playerIdParamsSchema,
  updatePlayerSchema,
  importWhatsAppListSchema,
} from "./schemas/player.schemas";
import {
  addPaymentValueSchema,
  createPaymentSchema,
  generateMonthlyPaymentsSchema,
  paymentIdParamsSchema,
  updatePaymentSchema,
} from "./schemas/payment.schemas";
import {
  createExpenseSchema,
  createExpenseTypeSchema,
  expenseIdParamsSchema,
  updateExpenseSchema,
} from "./schemas/expense.schemas";
import { updateFeeSettingSchema } from "./schemas/fee.schemas";
import {
  balanceDashboardQuerySchema,
  monthlyReportQuerySchema,
  publicMonthlyReportQuerySchema,
} from "./schemas/report.schemas";

const router = Router();

router.post(
  "/users",
  validate(createUserSchema),
  new CreateUserController().handle
); // Criar usuário
router.post(
  "/session",
  validate(authUserSchema),
  new AuthUserController().handle
); // Autenticar usuário
router.get("/me", isAuthenticated, new DetailUserController().handle); // Detalhar usuário
router.put(
  "/users",
  isAuthenticated,
  validate(updateUserSchema),
  new UpdateUserController().handle
); // Atualizar usuário

// ------------- Players -------------
router.post(
  "/players",
  isAuthenticated,
  isAdmin,
  validate(createPlayerSchema),
  new CreatePlayerController().handle
); // Criar jogador
router.get("/players", isAuthenticated, new ListPlayerController().handle); // Listar jogadores
router.get(
  "/players/:id",
  isAuthenticated,
  validate(playerIdParamsSchema, "params"),
  new DetailPlayerController().handle
); // Buscar jogador por id
router.put(
  "/players/:id",
  isAuthenticated,
  isAdmin,
  validate(playerIdParamsSchema, "params"),
  validate(updatePlayerSchema),
  new UpdatePlayerController().handle
); // Editar jogador
router.delete(
  "/players/:id",
  isAuthenticated,
  isAdmin,
  validate(playerIdParamsSchema, "params"),
  new DeactivatePlayerController().handle
); // Desativar jogador
router.post(
  "/imports/whatsapp",
  isAuthenticated,
  isAdmin,
  validate(importWhatsAppListSchema),
  new ImportWhatsAppPlayerListController().handle
); // Importar lista colada do WhatsApp

// ------------- Fees -------------
router.get("/fees", isAuthenticated, new ListFeeSettingController().handle); // Listar taxas
router.put(
  "/fees",
  isAuthenticated,
  isAdmin,
  validate(updateFeeSettingSchema),
  new UpdateFeeSettingController().handle
); // Atualizar taxa

// ------------- Payments -------------
router.post(
  "/payments",
  isAuthenticated,
  isAdmin,
  validate(createPaymentSchema),
  new CreatePaymentController().handle
); // Gerar mensalidade
router.post(
  "/payments/generate-month",
  isAuthenticated,
  isAdmin,
  validate(generateMonthlyPaymentsSchema),
  new GenerateMonthlyPaymentsController().handle
); // Gerar cobrança de todos os mensalistas do mês
router.get("/payments", isAuthenticated, new ListPaymentController().handle); // Listar pagamentos
router.get(
  "/payments/:id",
  isAuthenticated,
  validate(paymentIdParamsSchema, "params"),
  new DetailPaymentController().handle
); // Detalhar pagamento
router.put(
  "/payments/:id",
  isAuthenticated,
  isAdmin,
  validate(paymentIdParamsSchema, "params"),
  validate(updatePaymentSchema),
  new UpdatePaymentController().handle
); // Editar pagamento (valor total / notas)
router.patch(
  "/payments/:id/add",
  isAuthenticated,
  isAdmin,
  validate(paymentIdParamsSchema, "params"),
  validate(addPaymentValueSchema),
  new AddPaymentValueController().handle
); // Somar valor pago no mês (ex: 15 depois +25)
router.patch(
  "/payments/:id/paid",
  isAuthenticated,
  isAdmin,
  validate(paymentIdParamsSchema, "params"),
  new MarkPaymentPaidController().handle
); // Quitar total
router.patch(
  "/payments/:id/overdue",
  isAuthenticated,
  isAdmin,
  validate(paymentIdParamsSchema, "params"),
  new MarkPaymentOverdueController().handle
); // Marcar como atrasado
router.patch(
  "/payments/:id/cancel",
  isAuthenticated,
  isAdmin,
  validate(paymentIdParamsSchema, "params"),
  new CancelPaymentController().handle
); // Cancelar pagamento

// ------------- Expenses -------------
router.get(
  "/expense-types",
  isAuthenticated,
  new ListExpenseTypeController().handle
); // Listar tipos de despesa
router.post(
  "/expense-types",
  isAuthenticated,
  isAdmin,
  validate(createExpenseTypeSchema),
  new CreateExpenseTypeController().handle
); // Criar tipo de despesa
router.post(
  "/expenses",
  isAuthenticated,
  isAdmin,
  validate(createExpenseSchema),
  new CreateExpenseController().handle
); // Criar despesa
router.get("/expenses", isAuthenticated, new ListExpenseController().handle); // Listar despesas
router.get(
  "/expenses/:id",
  isAuthenticated,
  validate(expenseIdParamsSchema, "params"),
  new DetailExpenseController().handle
); // Detalhar despesa
router.put(
  "/expenses/:id",
  isAuthenticated,
  isAdmin,
  validate(expenseIdParamsSchema, "params"),
  validate(updateExpenseSchema),
  new UpdateExpenseController().handle
); // Editar despesa
router.delete(
  "/expenses/:id",
  isAuthenticated,
  isAdmin,
  validate(expenseIdParamsSchema, "params"),
  new DeleteExpenseController().handle
); // Remover despesa

// ------------- Reports / Dashboard -------------
router.get(
  "/reports/monthly",
  isAuthenticated,
  validate(monthlyReportQuerySchema, "query"),
  new MonthlyReportController().handle
); // Relatório mensal
router.get(
  "/reports/share",
  isAuthenticated,
  validate(monthlyReportQuerySchema, "query"),
  new ShareMonthlyReportController().handle
); // Token do link público
router.get(
  "/public/reports/monthly",
  validate(publicMonthlyReportQuerySchema, "query"),
  new PublicMonthlyReportController().handle
); // Relatório público (link do grupo)
router.get(
  "/dashboard/balance",
  isAuthenticated,
  validate(balanceDashboardQuerySchema, "query"),
  new BalanceDashboardController().handle
); // Dashboard de saldo

export { router };
