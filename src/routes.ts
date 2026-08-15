import { Router } from "express";
import { CreateUserController } from "./controllers/user/CreateUserController";
import { AuthUserController } from "./controllers/user/AuthUserController";
import { DetailUserController } from "./controllers/user/DetailUserController";
import { isAuthenticated } from "./middlewares/isAuthenticated";
import { isAdmin } from "./middlewares/isAdmin";
import { isStaff } from "./middlewares/isStaff";
import { isPlayer } from "./middlewares/isPlayer";
import { validate } from "./middlewares/validate";
import { UpdateUserController } from "./controllers/user/UpdateUserController";
import { CreatePlayerController } from "./controllers/player/CreatePlayerController";
import { ListPlayerController } from "./controllers/player/ListPlayerController";
import { DetailPlayerController } from "./controllers/player/DetailPlayerController";
import { PlayerYearHistoryController } from "./controllers/player/PlayerYearHistoryController";
import { GrantPlayerAccessController } from "./controllers/player/GrantPlayerAccessController";
import { PlayerStatusController } from "./controllers/player/PlayerStatusController";
import { ListPlayerShareController } from "./controllers/player/ListPlayerShareController";
import { UpdatePlayerController } from "./controllers/player/UpdatePlayerController";
import { DeactivatePlayerController } from "./controllers/player/DeactivatePlayerController";
import { ActivatePlayerController } from "./controllers/player/ActivatePlayerController";
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
import { UpsertMatchController } from "./controllers/match/UpsertMatchController";
import { ListMatchController } from "./controllers/match/ListMatchController";
import { GenerateMatchSharesController } from "./controllers/match/GenerateMatchSharesController";
import { MarkMatchSharePaidController } from "./controllers/match/MarkMatchSharePaidController";
import { CancelMatchShareController } from "./controllers/match/CancelMatchShareController";
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
  playerHistoryQuerySchema,
  grantPlayerAccessSchema,
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
import {
  listMatchQuerySchema,
  matchIdParamsSchema,
  matchShareIdParamsSchema,
  upsertMatchSchema,
} from "./schemas/match.schemas";

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
router.get(
  "/me/status",
  isAuthenticated,
  isPlayer,
  new PlayerStatusController().handle
); // Situação do jogador logado
router.get(
  "/me/shares",
  isAuthenticated,
  isPlayer,
  new ListPlayerShareController().handle
); // Rateios do jogador logado
router.put(
  "/users",
  isAuthenticated,
  isStaff,
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
router.get(
  "/players",
  isAuthenticated,
  isStaff,
  new ListPlayerController().handle
); // Listar jogadores
router.get(
  "/players/:id/history",
  isAuthenticated,
  isStaff,
  validate(playerIdParamsSchema, "params"),
  validate(playerHistoryQuerySchema, "query"),
  new PlayerYearHistoryController().handle
); // Histórico anual do jogador
router.get(
  "/players/:id",
  isAuthenticated,
  isStaff,
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
router.patch(
  "/players/:id/activate",
  isAuthenticated,
  isAdmin,
  validate(playerIdParamsSchema, "params"),
  new ActivatePlayerController().handle
); // Reativar jogador
router.post(
  "/players/:id/access",
  isAuthenticated,
  isAdmin,
  validate(playerIdParamsSchema, "params"),
  validate(grantPlayerAccessSchema),
  new GrantPlayerAccessController().handle
); // Liberar login do jogador
router.post(
  "/imports/whatsapp",
  isAuthenticated,
  isAdmin,
  validate(importWhatsAppListSchema),
  new ImportWhatsAppPlayerListController().handle
); // Importar lista colada do WhatsApp

// ------------- Fees -------------
router.get(
  "/fees",
  isAuthenticated,
  isStaff,
  new ListFeeSettingController().handle
); // Listar taxas
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
router.get(
  "/payments",
  isAuthenticated,
  isStaff,
  new ListPaymentController().handle
); // Listar pagamentos
router.get(
  "/payments/:id",
  isAuthenticated,
  isStaff,
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
  isStaff,
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

// ------------- Pelada / Rateio -------------
router.get(
  "/matches",
  isAuthenticated,
  isStaff,
  validate(listMatchQuerySchema, "query"),
  new ListMatchController().handle
); // Listar pelada do dia
router.post(
  "/matches",
  isAuthenticated,
  isAdmin,
  validate(upsertMatchSchema),
  new UpsertMatchController().handle
); // Salvar quem jogou
router.post(
  "/matches/:id/shares",
  isAuthenticated,
  isAdmin,
  validate(matchIdParamsSchema, "params"),
  new GenerateMatchSharesController().handle
); // Gerar cobrança do rateio
router.patch(
  "/match-shares/:id/paid",
  isAuthenticated,
  isAdmin,
  validate(matchShareIdParamsSchema, "params"),
  new MarkMatchSharePaidController().handle
); // Quitar rateio
router.patch(
  "/match-shares/:id/cancel",
  isAuthenticated,
  isAdmin,
  validate(matchShareIdParamsSchema, "params"),
  new CancelMatchShareController().handle
); // Cancelar rateio

// ------------- Reports / Dashboard -------------
router.get(
  "/reports/monthly",
  isAuthenticated,
  isStaff,
  validate(monthlyReportQuerySchema, "query"),
  new MonthlyReportController().handle
); // Relatório mensal
router.get(
  "/reports/share",
  isAuthenticated,
  isStaff,
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
  isStaff,
  validate(balanceDashboardQuerySchema, "query"),
  new BalanceDashboardController().handle
); // Dashboard de saldo

export { router };
