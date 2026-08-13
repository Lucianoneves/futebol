# Futebol

Gestão de um time amador: jogadores (mensalistas e convidados), pagamentos, despesas, saldo e relatório do mês.

O repositório tem **uma API** e **um painel web**.

```text
futebol/            API (Express + Prisma + PostgreSQL)
  prisma/           schema do banco
  src/              rotas, controllers, services
futebol-web/        Painel admin (Next.js)
```

Fluxo da API: **Rota → Controller → Service → Prisma**.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| API | Node.js, Express, TypeScript, Prisma, PostgreSQL (Neon), JWT, Zod |
| Painel | Next.js (App Router), TypeScript, TanStack Query, Tailwind CSS 4 |

## Quem pode o quê

| Quem | Acesso |
|------|--------|
| **ADMIN** | Login no painel. Cadastra, edita, gera cobrança, registra pagamento, lança despesa. |
| **USER** | Login no painel. Só consulta (listas e relatórios). Sem botões de alterar. |
| **Link do grupo** | Sem login. Página pública **somente consulta** (quem pagou / quem deve). Sem menu, sem formulário, sem edição. |

A API de escrita (`POST` / `PUT` / `PATCH` / `DELETE`) exige token de **admin**. O relatório público é só `GET`.

## Como rodar

Os dois precisam estar no ar ao mesmo tempo.

### 1. API (`http://localhost:3003`)

Na raiz do projeto:

```bash
yarn
```

Arquivo `.env`:

```env
DATABASE_URL="sua-connection-string-postgresql"
JWT_SECRET="seu-segredo"
```

```bash
npx prisma generate
npx prisma db push
yarn dev
```

O primeiro usuário criado (`POST /users`) vira `ADMIN`.

### 2. Painel (`http://localhost:3000`)

Em `futebol-web/`:

```bash
npm install
```

Arquivo `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3003
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`NEXT_PUBLIC_APP_URL` é o endereço que vai no link do WhatsApp. Em produção use o domínio público do painel. `localhost` **não abre** no celular do grupo — publique o painel ou abra pelo IP da rede (`http://192.168.x.x:3000`) e copie o link daí.

```bash
npm run dev
```

Abra `http://localhost:3000` e faça login.

## Painel

| Rota | Função |
|------|--------|
| `/login` | Login (JWT) |
| `/dashboard` | Saldo do mês (receitas − despesas) |
| `/players` | Mensalistas e convidados, busca, ordem A–Z, importar lista do WhatsApp |
| `/payments` | Cobrança do mês, busca, gerar mensalistas, somar/subtrair, copiar/enviar relatório |
| `/expenses` | Tipo + valor + data; total do mês |
| `/fees` | Taxas padrão MONTHLY / CASUAL |
| `/reports` | Quem pagou / quem deve, total pago, copiar link, enviar no WhatsApp, copiar imagem |
| `/r/:ano/:mês?t=` | Relatório público **somente consulta** (sem login) |

### O que já funciona

- **Jogadores** em duas listas (Mensalistas / Convidados), numerados, A–Z, busca pelo nome.
- **Lista do WhatsApp**: cola a lista do grupo (`Ney 40 ✅`, `Barto`, `por jogo 15$`) → cadastra jogadores e atualiza pagamentos.
- **Pagamentos**: **Gerar cobrança dos mensalistas** cria a pendência de todos no mês. Listas A–Z (mensalistas e convidados), busca, totais arrecadado / pendente. Se a cobrança já existe e ainda está pendente, **Registrar** reaproveita. **Valor pago agora** lança 40 ou 80. Dá para somar ou subtrair depois.
- **Mensalista sem atraso** que paga **80** (taxa 40): 40 quitam o mês vigente e 40 vão como saldo para o **próximo mês**. Se estiver atrasado, o extra não avança.
- **Despesas**: tipo (Carne, Carvão, Gelo…) + valor + data. Sem campo descrição. Total atualiza sozinho.
- **Relatórios**: cards de total pago no mês, em dia e em aberto; duas tabelas (quem pagou / quem deve); busca pelo nome.
- **Enviar no WhatsApp**: **Copiar link** ou **Enviar no WhatsApp** manda a página pública do relatório. **Copiar imagem** gera um PNG no visual da tela. O link é **somente consulta** — só o admin altera o sistema.

## API

Quase todas as rotas pedem `Authorization: Bearer <token>`. Escrita exige admin.

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/users` | Não | Criar usuário (o 1º vira ADMIN) |
| POST | `/session` | Não | Login |
| GET | `/me` | Token | Usuário logado |
| PUT | `/users` | Token | Atualizar nome/e-mail |
| POST | `/players` | Admin | Criar jogador |
| GET | `/players` | Token | Listar (`?active=true\|false`) |
| GET | `/players/:id` | Token | Detalhar jogador |
| PUT | `/players/:id` | Admin | Editar jogador |
| DELETE | `/players/:id` | Admin | Desativar (`active = false`) |
| POST | `/imports/whatsapp` | Admin | Prévia/importar lista colada (`apply`) |
| GET | `/fees` | Token | Listar taxas (cria 40 / 15 na 1ª vez) |
| PUT | `/fees` | Admin | Atualizar taxa (`type` + `amount`) |
| POST | `/payments` | Admin | Gerar ou reaproveitar cobrança (`paid_amount` opcional) |
| POST | `/payments/generate-month` | Admin | Gerar cobrança de todos os mensalistas do mês |
| GET | `/payments` | Token | Listar (`player_id`, `year`, `month`, `status`) |
| GET | `/payments/:id` | Token | Detalhar pagamento |
| PUT | `/payments/:id` | Admin | Editar valor total / notas |
| PATCH | `/payments/:id/add` | Admin | Somar ou subtrair (`value` pode ser negativo). Extra de mensalista vai ao próximo mês |
| PATCH | `/payments/:id/paid` | Admin | Quitar (+ CashFlow INCOME) |
| PATCH | `/payments/:id/overdue` | Admin | Marcar atrasado |
| PATCH | `/payments/:id/cancel` | Admin | Cancelar |
| GET | `/expense-types` | Token | Listar tipos (Carne, Carvão, Campo…) |
| POST | `/expense-types` | Admin | Cadastrar novo tipo |
| POST | `/expenses` | Admin | Somar item (+ CashFlow OUTCOME) |
| GET | `/expenses` | Token | Listar (`?expense_type_id=`) |
| GET | `/expenses/:id` | Token | Detalhar despesa |
| PUT | `/expenses/:id` | Admin | Editar tipo, valor ou data |
| DELETE | `/expenses/:id` | Admin | Remover |
| GET | `/reports/monthly` | Token | Relatório (`year`, `month`) com `paidTotal` |
| GET | `/reports/share` | Token | Token do link público (`year`, `month`) |
| GET | `/public/reports/monthly` | Token do link | Relatório público somente leitura (`year`, `month`, `token`) |
| GET | `/dashboard/balance` | Token | Saldo (`year`, `month` opcionais) |

Se o usuário já existia antes do campo `role`: faça login de novo. Para promover admin:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'seu@email.com';
```

### Exemplos

**Login**

```http
POST /session
Content-Type: application/json

{
  "email": "seu@email.com",
  "password": "suaSenha"
}
```

**Registrar pagamento** (reaproveita cobrança pendente do mês)

```http
POST /payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "player_id": "uuid-do-jogador",
  "year": 2026,
  "month": 8,
  "paid_amount": 80
}
```

**Importar lista do WhatsApp** (prévia: `apply: false`)

```http
POST /imports/whatsapp
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "7 Ney 40 ✅\n10 Barto\nLista de pagamento por jogo 15$\nDuda. 15 ✅",
  "year": 2026,
  "month": 8,
  "apply": true
}
```

**Somar despesa**

```http
POST /expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "expense_type_id": "uuid-do-tipo",
  "amount": 40,
  "spentAt": "2026-08-12T12:00:00"
}
```

**Gerar link público do relatório** (depois abra `/r/{ano}/{mês}?t={token}` no painel)

```http
GET /reports/share?year=2026&month=8
Authorization: Bearer <token>
```

**Consultar relatório pelo link** (sem login, só leitura)

```http
GET /public/reports/monthly?year=2026&month=8&token=abc123
```

## Domínio

```text
User (login / ADMIN ou USER)
FeeSetting (MONTHLY = 40, CASUAL = 15 — editáveis)
Player (MONTHLY | CASUAL)
  └── Payment (mês/ano, valor, pago parcial, status)
         └── CashFlow (INCOME)

ExpenseType (Carne, Carvão, Gelo, Campo…)
Expense (tipo + valor + data)
  └── CashFlow (OUTCOME)
```

Enums: `PlayerType`, `PaymentStatus`, `CashFlowType`, `Role`.

## Ideias futuras

### Curto prazo
- Histórico anual do jogador (o que pagou em cada mês)
- Marcar automaticamente como atrasado no dia 1º do mês seguinte

### Médio prazo
- Presença na pelada (quem jogou na quarta)
- Lembrete de atraso no WhatsApp ou e-mail
- Comprovante Pix / QR Code da mensalidade
- Relatório em PDF ou Excel (arrecadação, despesas, saldo)
- Rateio da pelada: despesas do dia ÷ quem jogou

### Longo prazo
- App mobile para o jogador ver se está em dia
- Multi-time (vários grupos na mesma plataforma)
- Integração Pix (pagamento confirmado sozinho)
