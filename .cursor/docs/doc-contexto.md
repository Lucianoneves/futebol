# Futebol — Documento de Contexto e Diretrizes para IA

> **Documento destinado a agentes de IA, desenvolvedores e ferramentas de desenvolvimento assistido por IA.**
>
> Este documento define o contexto funcional, técnico, arquitetural e as regras de desenvolvimento do sistema **Futebol**. Seu objetivo é permitir que uma IA compreenda o projeto antes de modificar ou implementar código, reduzindo alterações inconsistentes, duplicação de regras, regressões e decisões incompatíveis com a arquitetura existente.

---

# 1. Objetivo deste documento

Este documento deve funcionar como uma **fonte de contexto para a IA durante o desenvolvimento do sistema Futebol**.

Antes de implementar qualquer funcionalidade, corrigir um bug, refatorar código ou alterar uma regra existente, a IA deve considerar:

1. este documento;
2. o `README.md` do projeto;
3. a arquitetura existente;
4. o schema do Prisma;
5. os serviços e regras de negócio existentes;
6. os contratos atuais da API;
7. os componentes e padrões já utilizados no painel web;
8. os testes existentes.

O objetivo não é apenas fazer o código funcionar.

A IA deve preservar:

* arquitetura;
* regras de negócio;
* segurança;
* consistência financeira;
* tipagem;
* separação de responsabilidades;
* reutilização;
* testabilidade;
* experiência de uso;
* compatibilidade com funcionalidades existentes.

---

# 2. Regra principal para a IA

## Antes de alterar qualquer coisa

A IA **NÃO deve começar escrevendo código imediatamente**.

Primeiro deve:

1. entender o objetivo da alteração;
2. localizar os arquivos relacionados;
3. ler o `README.md`;
4. identificar a regra de negócio envolvida;
5. identificar onde essa regra atualmente está implementada;
6. verificar o schema do banco;
7. verificar serviços/controllers/rotas relacionados;
8. verificar componentes do painel relacionados;
9. verificar testes existentes;
10. avaliar possíveis impactos.

Somente depois deve implementar.

---

# 3. Fonte de verdade

A seguinte ordem deve ser utilizada para interpretar o comportamento do sistema:

### 1. Código e regras atualmente implementados

Representam o comportamento real do sistema.

### 2. `README.md`

Representa a documentação oficial das funcionalidades, rotas e regras esperadas.

### 3. Schema do Prisma

Representa a estrutura persistida dos dados e relacionamentos.

### 4. Testes

Representam comportamentos que precisam ser preservados.

### 5. Este documento

Representa o contexto arquitetural e funcional utilizado para orientar decisões.

### 6. Solicitação atual

Uma solicitação do usuário pode alterar o comportamento existente, mas a IA deve identificar explicitamente quando isso ocorrer.

---

# 4. Regra contra alteração silenciosa

A IA nunca deve modificar uma regra de negócio existente silenciosamente.

Exemplo:

Se atualmente:

```text
Mensalista = R$ 40,00
Avulso = R$ 15,00
```

e uma nova solicitação pedir:

```text
Mensalista = R$ 50,00
```

a IA deve reconhecer que houve uma alteração de regra.

Antes de implementar, deve identificar:

* onde o valor é definido;
* onde é calculado;
* onde é exibido;
* onde é salvo;
* se existem relatórios dependentes;
* se existem cobranças antigas;
* se existem testes dependentes;
* se o novo valor deve valer apenas para novos registros ou também para registros existentes.

---

# 5. Visão geral do sistema

O **Futebol** é um sistema web para gerenciamento financeiro e operacional de um **time de futebol amador**.

O sistema existe para centralizar informações que normalmente seriam controladas por:

* planilhas;
* grupos de WhatsApp;
* anotações;
* cálculos manuais;
* comprovantes;
* controles individuais.

O objetivo é transformar essas informações em um sistema organizado, confiável e auditável.

---

# 6. Objetivos do sistema

O sistema deve permitir que o responsável pelo time consiga:

* cadastrar jogadores;
* diferenciar mensalistas e convidados;
* controlar pagamentos;
* acompanhar cobranças;
* registrar despesas;
* controlar o caixa;
* calcular rateios;
* acompanhar saldo;
* gerar relatórios;
* consultar o histórico individual de jogadores;
* disponibilizar um relatório público somente leitura.

---

# 7. Problema que o sistema resolve

Um time amador possui entradas e saídas financeiras recorrentes.

### Entradas

Exemplos:

* mensalidades;
* pagamentos avulsos;
* contribuições;
* outros recebimentos eventualmente definidos pelo sistema.

### Saídas

Exemplos:

* aluguel de campo;
* arbitragem;
* materiais esportivos;
* água;
* churrasco;
* outras despesas do time.

Sem um sistema centralizado, é fácil ocorrer:

* cobrança duplicada;
* jogador considerado inadimplente incorretamente;
* saldo incorreto;
* despesas esquecidas;
* valores divergentes;
* dificuldade para descobrir quem pagou;
* dificuldade para descobrir quanto o time possui;
* relatórios inconsistentes.

O Futebol deve reduzir esses problemas por meio de regras centralizadas e dados estruturados.

---

# 8. Arquitetura geral

O projeto é dividido em dois sistemas principais:

```text
futebol/
│
├── API
│   ├── Express
│   ├── TypeScript
│   ├── Prisma
│   └── PostgreSQL
│
└── futebol-web/
    ├── Next.js
    ├── React
    └── TypeScript
```

A separação deve ser preservada.

---

# 9. API

A API é responsável por:

* autenticação;
* autorização;
* acesso ao banco;
* validação;
* regras de negócio;
* cálculos financeiros;
* persistência;
* relatórios;
* controle dos jogadores;
* pagamentos;
* despesas;
* caixa;
* rateios.

A API deve ser considerada a **camada de autoridade das regras de negócio**.

O painel web não deve duplicar regras financeiras críticas.

---

# 10. Painel Web

O painel web é responsável principalmente por:

* interface;
* navegação;
* formulários;
* tabelas;
* filtros;
* dashboards;
* feedback visual;
* consumo da API.

O painel não deve assumir responsabilidades que pertencem à API.

Por exemplo, evitar:

```typescript
const saldo = entradas - despesas;
```

espalhado em vários componentes.

Preferir:

```text
API
 ↓
Service financeiro
 ↓
Resultado calculado
 ↓
Endpoint
 ↓
Painel
```

O frontend pode formatar e apresentar o valor, mas a regra financeira deve permanecer centralizada.

---

# 11. Stack tecnológica

## Backend

* Node.js
* Express
* TypeScript
* Prisma
* PostgreSQL
* autenticação baseada em JWT
* bcrypt para armazenamento seguro de senhas

## Frontend

* Next.js
* React
* TypeScript

---

# 12. Princípios arquiteturais

O projeto deve seguir os seguintes princípios.

## 12.1 Separação de responsabilidades

Cada camada deve possuir uma responsabilidade clara.

Exemplo:

```text
Route
 ↓
Controller
 ↓
Service
 ↓
Prisma
 ↓
PostgreSQL
```

### Route

Define o endpoint.

### Controller

Recebe a requisição e devolve a resposta.

### Service

Contém a regra de negócio.

### Prisma

Responsável pela comunicação com o banco.

---

# 13. Regra importante: Controller não deve conter regra de negócio complexa

Evitar:

```typescript
if (tipo === "MENSALISTA") {
  valor = 40;
} else {
  valor = 15;
}
```

espalhado em controllers.

Preferir:

```typescript
pagamentoService.criar(...)
```

e centralizar a regra no service.

---

# 14. Componentes do domínio

O sistema possui alguns domínios principais.

```text
Autenticação
    │
    ├── Administrador
    └── Autorização

Jogadores
    │
    ├── Mensalistas
    └── Convidados

Financeiro
    │
    ├── Pagamentos
    ├── Cobranças
    ├── Despesas
    ├── Caixa
    ├── Rateios
    └── Saldo

Relatórios
    │
    ├── Mensal
    ├── Jogador
    └── Público
```

---

# 15. Jogadores

O sistema deve permitir controlar os jogadores que participam do time.

Existem dois conceitos principais:

## Mensalista

Jogador que possui uma cobrança mensal.

Regra atualmente definida:

```text
Mensalista = R$ 40,00 por mês
```

Esse valor deve ser tratado como regra de negócio e não deve ser duplicado em vários arquivos.

---

## Convidado / Avulso

Jogador que participa de uma partida sem necessariamente fazer parte do grupo de mensalistas.

Regra atualmente definida:

```text
Avulso = R$ 15,00 por participação
```

A implementação deve garantir que o pagamento esteja relacionado corretamente ao jogador e ao contexto correspondente.

---

# 16. Pagamentos

Pagamento representa uma entrada financeira relacionada a um jogador.

O sistema deve permitir:

* registrar pagamento;
* identificar jogador;
* identificar tipo;
* registrar valor;
* registrar data;
* identificar status;
* consultar histórico;
* utilizar os pagamentos nos cálculos financeiros.

---

# 17. Status de pagamento

Os pagamentos possuem estados.

Exemplo:

```text
PENDENTE
PAGO
```

A IA não deve criar novos status sem necessidade.

Antes de criar outro estado, deve verificar:

* schema;
* services;
* frontend;
* relatórios;
* filtros;
* testes.

---

# 18. Cobranças

Cobrança representa um valor que o jogador deveria pagar.

É importante diferenciar:

```text
Cobrança
```

de:

```text
Pagamento
```

Uma cobrança pode existir sem ter sido paga.

Exemplo:

```text
João
Mensalidade de agosto
R$ 40,00
PENDENTE
```

Depois:

```text
João
Mensalidade de agosto
R$ 40,00
PAGO
```

A IA deve preservar essa distinção quando o domínio existente utilizá-la.

---

# 19. Despesas

Despesas representam saídas financeiras do time.

Exemplos:

```text
Aluguel do campo
Arbitragem
Água
Material esportivo
Churrasco
Outros
```

Cada despesa deve possuir informações suficientes para permitir:

* identificação;
* valor;
* data;
* descrição;
* consulta;
* inclusão no caixa;
* relatório.

---

# 20. Caixa

O caixa representa a situação financeira do time.

Conceitualmente:

```text
Saldo = Entradas - Saídas
```

Onde:

```text
Entradas = pagamentos/recebimentos considerados no período

Saídas = despesas consideradas no período
```

A IA deve evitar múltiplas implementações diferentes do mesmo cálculo.

---

# 21. Consistência financeira

Este é um dos pontos mais importantes do sistema.

Valores financeiros não devem ser tratados de maneira inconsistente.

Evitar:

```typescript
valor * 0.1
```

ou operações com `number` sem considerar precisão monetária quando isso puder causar divergências.

O sistema deve utilizar uma estratégia consistente para valores monetários definida pelo projeto.

Se o projeto utilizar `Decimal` do Prisma, preservar esse padrão.

---

# 22. Nunca usar valores financeiros mágicos

Evitar:

```typescript
if (tipo === "MENSALISTA") {
  return 40;
}
```

em diversos arquivos.

Preferir uma fonte centralizada de regra.

Por exemplo:

```text
financeiro/
 ├── regras.ts
 ├── calculos.ts
 └── services/
```

ou a estrutura equivalente já existente no projeto.

O objetivo é que uma regra financeira tenha **um único ponto de definição**.

---

# 23. Rateio das peladas

O sistema deve permitir representar situações em que determinados custos são distribuídos entre participantes.

Conceitualmente:

```text
Valor da despesa
÷
Número de participantes
=
Valor individual
```

Porém, a IA não deve assumir que todo rateio funciona dessa maneira.

Antes de implementar ou alterar o cálculo, deve consultar:

* README;
* service atual;
* schema;
* regras existentes.

---

# 24. Saldo individual do jogador

O sistema deve permitir consultar a situação financeira de um jogador.

Exemplo conceitual:

```text
Jogador: João

Mensalidades:
Agosto     R$ 40,00   PAGO
Setembro   R$ 40,00   PENDENTE

Avulsos:
03/08      R$ 15,00   PAGO

Total pago:
R$ 55,00
```

O resultado deve ser produzido pela API sempre que representar uma regra de negócio.

---

# 25. Relatórios mensais

O relatório mensal deve permitir compreender a movimentação financeira do período.

Exemplo:

```text
RELATÓRIO — AGOSTO/2026

Entradas
--------------------------------
Mensalidades       R$ xxx,xx
Avulsos            R$ xxx,xx
Outros             R$ xxx,xx

Total de entradas  R$ xxx,xx


Despesas
--------------------------------
Campo              R$ xxx,xx
Arbitragem         R$ xxx,xx
Outros             R$ xxx,xx

Total de despesas  R$ xxx,xx


Saldo
--------------------------------
R$ xxx,xx
```

Os valores devem ser calculados de forma consistente com o caixa.

---

# 26. Relatório público

O sistema possui uma área pública de consulta.

Essa área deve ser:

```text
Somente leitura
```

O usuário público não deve conseguir:

* alterar jogadores;
* registrar pagamentos;
* excluir despesas;
* alterar valores;
* acessar dados administrativos;
* executar operações protegidas.

A API deve garantir essa restrição.

Não confiar apenas na interface.

---

# 27. Autenticação

O painel administrativo deve possuir autenticação.

A autenticação deve proteger recursos administrativos.

Fluxo conceitual:

```text
Login
 ↓
API valida credenciais
 ↓
Senha comparada com bcrypt
 ↓
JWT gerado
 ↓
Cliente armazena sessão/token conforme arquitetura
 ↓
Requisições autenticadas
```

---

# 28. Autorização

Autenticação responde:

> Quem é o usuário?

Autorização responde:

> O que esse usuário pode fazer?

A IA deve tratar as duas coisas separadamente.

Rotas administrativas devem verificar autenticação e, quando necessário, autorização.

---

# 29. Segurança

Nunca:

* armazenar senha em texto puro;
* retornar senha na API;
* confiar em dados enviados pelo frontend;
* permitir alteração financeira sem autorização;
* deixar endpoints administrativos públicos;
* colocar segredo em código-fonte;
* versionar `.env`.

---

# 30. Variáveis de ambiente

Informações sensíveis devem permanecer em variáveis de ambiente.

Exemplos:

```env
DATABASE_URL=
JWT_SECRET=
```

Nunca inserir valores reais diretamente no código.

---

# 31. Validação de entrada

Todo dado recebido da API deve ser tratado como não confiável.

Validar:

* tipos;
* campos obrigatórios;
* valores;
* enums;
* IDs;
* datas;
* valores monetários;
* permissões.

A validação deve ocorrer antes de executar operações críticas.

---

# 32. TypeScript

O projeto deve utilizar TypeScript de maneira segura.

Evitar:

```typescript
any
```

quando houver alternativa.

Evitar também:

```typescript
as any
```

para esconder problemas de tipagem.

Preferir:

* interfaces;
* types;
* enums;
* tipos inferidos;
* tipos do Prisma;
* unions;
* validação explícita.

---

# 33. Frontend tipado

As respostas da API devem possuir tipos definidos.

Evitar:

```typescript
const data: any = await response.json();
```

Preferir:

```typescript
interface Jogador {
  id: string;
  nome: string;
  tipo: TipoJogador;
}
```

ou tipos compartilhados quando a arquitetura do projeto permitir.

---

# 34. Componentes React

Os componentes do painel devem ser pequenos.

Evitar componentes que fazem simultaneamente:

* requisição;
* cálculo financeiro;
* validação;
* renderização;
* gerenciamento de modal;
* tratamento de formulário;
* regras de negócio.

Preferir separação:

```text
Página
 ↓
Componentes
 ↓
Hooks
 ↓
API client
```

---

# 35. Reutilização

Antes de criar um componente novo, verificar se já existe algo equivalente.

Exemplos:

```text
Button
Modal
Input
Select
Table
Card
Badge
Loading
EmptyState
ErrorState
```

Não criar:

```text
PlayerButton
PaymentButton
ExpenseButton
ReportButton
```

se todos possuem comportamento visual e funcional equivalente.

---

# 36. Hooks

Hooks devem encapsular comportamentos reutilizáveis.

Exemplo:

```text
useJogadores()
usePagamentos()
useDespesas()
useRelatorioMensal()
```

A IA deve verificar se o projeto já possui padrão equivalente antes de criar novos hooks.

---

# 37. API Client

O acesso à API deve ser centralizado quando essa for a convenção do projeto.

Evitar espalhar:

```typescript
fetch("http://localhost:3000/api/...")
```

por dezenas de componentes.

Preferir uma camada:

```text
api/
 ├── jogadores.ts
 ├── pagamentos.ts
 ├── despesas.ts
 └── relatorios.ts
```

ou o padrão existente.

---

# 38. Tratamento de erros

Erros devem ser tratados de maneira previsível.

A API deve retornar respostas consistentes.

Exemplo conceitual:

```json
{
  "message": "Jogador não encontrado"
}
```

O frontend deve apresentar mensagens compreensíveis ao usuário.

Não exibir stack trace ou detalhes internos do servidor para usuários finais.

---

# 39. Status HTTP

Usar códigos HTTP adequados.

Exemplos:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

A IA não deve retornar `200` para operações que falharam.

---

# 40. Banco de dados

O banco deve ser tratado como parte central do domínio.

Antes de alterar o schema:

1. verificar modelos existentes;
2. verificar relacionamentos;
3. verificar enums;
4. verificar migrations;
5. verificar dados existentes;
6. verificar código dependente;
7. avaliar impacto.

Nunca alterar o schema sem verificar o impacto na aplicação.

---

# 41. Prisma

O Prisma deve ser utilizado como camada de acesso ao PostgreSQL.

Evitar SQL manual quando o Prisma resolver corretamente o problema.

Quando SQL raw for realmente necessário, deve haver justificativa técnica.

---

# 42. Relacionamentos

Antes de adicionar um relacionamento, verificar:

```text
Quem é dono desse dado?
Quem depende dele?
Pode ser excluído?
O que acontece com os registros relacionados?
```

Exemplo:

```text
Jogador
   │
   └── Pagamentos
```

A exclusão de um jogador pode afetar o histórico financeiro.

Portanto, exclusões devem ser avaliadas com cuidado.

---

# 43. Histórico financeiro

Dados financeiros não devem ser apagados indiscriminadamente.

Antes de implementar:

```text
DELETE pagamento
```

a IA deve verificar se o domínio exige preservação histórica.

Em sistemas financeiros, muitas vezes é mais seguro:

```text
PENDENTE
PAGO
CANCELADO
```

ou soft delete/auditoria, dependendo da regra existente.

Não criar essa regra automaticamente: primeiro verificar o comportamento atual.

---

# 44. Datas

Datas são críticas para:

* mensalidades;
* pagamentos;
* despesas;
* relatórios;
* fechamento mensal;
* rateios.

A IA deve verificar:

* timezone;
* formato;
* armazenamento;
* comparação;
* início/fim do mês.

Evitar lógica inconsistente como:

```typescript
new Date()
```

em vários lugares sem considerar timezone.

---

# 45. Relatórios por período

Um relatório mensal deve utilizar limites claros.

Conceitualmente:

```text
>= início do mês
<
início do próximo mês
```

Isso evita problemas com:

```text
23:59:59.999
```

quando possível.

---

# 46. Performance

Não fazer consultas desnecessárias.

Evitar:

```text
buscar jogadores
 ↓
para cada jogador
 ↓
buscar pagamentos
```

quando isso resultar em N+1 queries.

Preferir consultas relacionais ou agregações quando apropriado.

---

# 47. Transações

Operações financeiras que alteram múltiplos registros devem considerar transações.

Exemplo:

```text
Registrar pagamento
+
Atualizar cobrança
+
Atualizar status
```

Se uma etapa falhar, não deixar o banco em estado parcialmente atualizado.

Quando necessário, utilizar transação do Prisma.

---

# 48. Idempotência

Operações que possam ser repetidas devem ser analisadas quanto ao risco de duplicação.

Exemplo:

```text
Registrar pagamento
```

Não deve resultar em dois pagamentos se a mesma operação for enviada duas vezes quando o domínio exigir unicidade.

---

# 49. Regras de negócio centralizadas

As regras mais importantes do sistema devem ficar em serviços ou módulos de domínio.

Exemplos:

```text
valor da mensalidade
valor do avulso
cálculo do saldo
cálculo do rateio
status de pagamento
fechamento mensal
```

Não espalhar essas regras pelo frontend.

---

# 50. Dashboard

O dashboard administrativo deve apresentar informações úteis para tomada de decisão.

Exemplos:

```text
Jogadores ativos
Mensalistas
Convidados
Pagamentos recebidos
Pagamentos pendentes
Despesas
Saldo atual
Resumo do mês
```

Os indicadores devem utilizar dados da API.

---

# 51. UX

O painel deve fornecer feedback claro.

Operações importantes devem possuir:

* loading;
* sucesso;
* erro;
* estado vazio;
* confirmação quando necessário.

Exemplo:

```text
Salvando...
```

Depois:

```text
Pagamento registrado com sucesso.
```

Em caso de erro:

```text
Não foi possível registrar o pagamento.
Tente novamente.
```

---

# 52. Exclusões

Ações destrutivas devem exigir confirmação quando houver risco.

Exemplo:

```text
Deseja realmente excluir esta despesa?
```

A API também deve validar a permissão.

Confirmação visual não é mecanismo de segurança.

---

# 53. Convenções de código

Manter consistência com o padrão existente.

Antes de criar:

```text
arquivo
função
hook
service
controller
componente
tipo
```

verificar como os arquivos semelhantes são organizados.

A consistência existente tem prioridade sobre preferências pessoais da IA.

---

# 54. Estrutura conceitual da API

Uma estrutura esperada pode ser semelhante a:

```text
futebol/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middlewares/
│   ├── validators/
│   ├── types/
│   ├── utils/
│   └── config/
│
├── tests/
├── .env
├── package.json
└── README.md
```

A IA deve respeitar a estrutura real do projeto caso seja diferente.

---

# 55. Estrutura conceitual do painel

Uma organização possível:

```text
futebol-web/
├── app/
│   ├── login/
│   ├── dashboard/
│   │   ├── jogadores/
│   │   ├── pagamentos/
│   │   ├── despesas/
│   │   ├── caixa/
│   │   └── relatorios/
│   │
│   └── relatorio-publico/
│
├── components/
├── hooks/
├── services/
├── lib/
├── types/
└── ...
```

Novamente, a estrutura real existente tem prioridade.

---

# 56. Organização por domínio

Quando o projeto crescer, é desejável manter funcionalidades relacionadas próximas.

Exemplo:

```text
jogadores/
├── components/
├── hooks/
├── services/
├── types/
└── ...

pagamentos/
├── components/
├── hooks/
├── services/
├── types/
└── ...

despesas/
├── components/
├── hooks/
├── services/
└── ...
```

Não aplicar uma reorganização grande sem necessidade.

---

# 57. Testes

O projeto deve ser desenvolvido pensando em testes.

Prioridade para testes de:

### Regras financeiras

* mensalista;
* avulso;
* cobrança;
* pagamento;
* saldo;
* despesas;
* rateio;
* relatório mensal.

### Segurança

* login;
* token inválido;
* acesso sem autenticação;
* acesso público;
* autorização.

### API

* status HTTP;
* validação;
* erros;
* criação;
* atualização;
* exclusão.

---

# 58. TDD

Quando uma funcionalidade alterar comportamento, preferir:

```text
1. Criar teste
2. Executar
3. Verificar falha
4. Implementar
5. Executar novamente
6. Corrigir
7. Refatorar
```

O teste deve validar comportamento, não detalhes internos desnecessários.

---

# 59. Testes financeiros

Exemplo conceitual:

```text
Mensalista
R$ 40,00
Pagamento = PAGO
```

Resultado esperado:

```text
Entrada = R$ 40,00
```

Outro:

```text
Despesa = R$ 100,00
Entradas = R$ 300,00
```

Resultado:

```text
Saldo = R$ 200,00
```

Os valores reais e regras devem sempre seguir o domínio implementado no projeto.

---

# 60. Antes de criar uma nova funcionalidade

A IA deve responder mentalmente:

```text
Qual problema essa funcionalidade resolve?

Qual domínio ela pertence?

Existe algo semelhante?

Existe uma regra de negócio relacionada?

Precisa alterar o banco?

Precisa alterar a API?

Precisa alterar o frontend?

Precisa de autenticação?

Precisa de autorização?

Afeta relatórios?

Afeta cálculos financeiros?

Afeta dados existentes?

Precisa de teste?
```

---

# 61. Antes de corrigir um bug

Não corrigir apenas o sintoma.

A IA deve investigar:

```text
Origem do dado
      ↓
API
      ↓
Service
      ↓
Banco
      ↓
Resposta
      ↓
Frontend
      ↓
Componente
```

Exemplo:

Se o dashboard apresenta saldo incorreto, não assumir imediatamente que o problema está no componente.

Verificar:

```text
Banco
 ↓
Query
 ↓
Service financeiro
 ↓
Endpoint
 ↓
Resposta
 ↓
Frontend
```

---

# 62. Evitar soluções temporárias

Evitar soluções como:

```typescript
if (erro) {
  return valorFake;
}
```

ou:

```typescript
const valor = data?.valor ?? 0;
```

quando isso mascarar um problema real.

Valores padrão podem ser usados quando fizerem parte do comportamento esperado, mas não devem esconder erros de domínio.

---

# 63. Evitar duplicação

Se a IA encontrar a mesma regra implementada em dois ou mais lugares, deve avaliar centralização.

Exemplo ruim:

```text
Frontend:
R$ 40

API:
R$ 40

Relatório:
R$ 40
```

Isso pode gerar divergência.

Preferir:

```text
Regra central
     ↓
API
     ↓
Frontend
Relatório
```

---

# 64. Mudanças no banco

Toda alteração de banco deve considerar:

```text
Schema
Migration
Código backend
Queries
Services
Controllers
Frontend
Testes
Dados existentes
```

Não alterar somente `schema.prisma` e considerar a tarefa concluída.

---

# 65. Migrations

Não apagar migrations existentes para resolver problemas sem compreender o impacto.

Não executar reset do banco em ambiente de produção.

Em desenvolvimento, qualquer reset deve ser uma decisão consciente.

---

# 66. Compatibilidade

Uma alteração deve preservar funcionalidades existentes sempre que possível.

Antes:

```text
POST /pagamentos
```

Depois da alteração, não quebrar silenciosamente o contrato esperado.

Se for necessário alterar:

```text
rota
payload
resposta
status
regra
```

documentar o impacto.

---

# 67. API como contrato

O frontend deve consumir a API de acordo com o contrato existente.

Não criar endpoints duplicados para resolver um problema que poderia ser corrigido no endpoint atual.

Antes de criar:

```text
GET /saldo
```

verificar se já existe:

```text
GET /caixa
```

que fornece o mesmo conceito.

---

# 68. Regras para agentes de IA

Se múltiplos agentes forem utilizados no projeto, eles devem seguir este contexto.

Sugestão de responsabilidades:

```text
Agente Arquitetura
        ↓
Analisa estrutura e impactos

Agente Backend
        ↓
Implementa API e regras de negócio

Agente Frontend
        ↓
Implementa interface

Agente Banco
        ↓
Analisa Prisma e migrations

Agente Testes
        ↓
Cria e executa testes

Agente Segurança
        ↓
Audita autenticação/autorização

Agente Review
        ↓
Verifica consistência final
```

Nenhum agente deve ignorar as regras deste documento.

---

# 69. Comunicação entre agentes

Quando um agente modificar algo relevante, deve deixar claro:

```text
O que foi alterado
Por que foi alterado
Quais arquivos foram afetados
Qual regra de negócio foi envolvida
Quais impactos existem
Quais testes foram executados
```

---

# 70. Regra de não assumir

Quando a informação não estiver disponível, a IA não deve inventar.

Exemplo:

Se não souber:

```text
qual é o comportamento de cancelamento
```

não deve criar automaticamente:

```text
CANCELADO
```

Deve verificar:

* README;
* schema;
* código;
* testes.

Se ainda não houver definição, deve sinalizar a decisão necessária.

---

# 71. Regra de descoberta

Antes de criar um novo conceito, pesquisar o projeto.

Exemplo:

Antes de criar:

```text
PaymentStatus
```

pesquisar:

```text
StatusPagamento
PagamentoStatus
PAGO
PENDENTE
```

Isso evita duplicação.

---

# 72. Busca obrigatória antes de implementação

A IA deve pesquisar referências no projeto usando termos relacionados.

Para uma tarefa de pagamento:

```text
pagamento
pagamentos
Pagamento
Pagamentos
PAGO
PENDENTE
mensalista
avulso
```

Para jogador:

```text
jogador
Jogador
mensalista
convidado
```

Para financeiro:

```text
caixa
saldo
despesa
entrada
saída
relatório
```

---

# 73. Alteração mínima

Preferir a menor alteração que resolve corretamente o problema.

Não transformar:

```text
corrigir botão
```

em:

```text
reescrever todo o módulo
```

sem justificativa.

---

# 74. Refatoração

Refatorações grandes devem ser separadas de mudanças funcionais quando possível.

Evitar:

```text
feature + refactor gigante + mudança de arquitetura
```

na mesma alteração.

Isso dificulta:

* revisão;
* testes;
* rollback;
* identificação de bugs.

---

# 75. Logging

Logs devem ajudar na investigação sem expor informações sensíveis.

Evitar:

```typescript
console.log(password);
console.log(token);
```

Logs de desenvolvimento devem ser removidos ou substituídos por mecanismo apropriado quando não forem mais necessários.

---

# 76. Dados sensíveis

Nunca expor:

* senha;
* JWT;
* secrets;
* DATABASE_URL;
* credenciais;
* dados administrativos desnecessários.

---

# 77. Estado do frontend

O estado deve permanecer no nível apropriado.

Não colocar todo o estado globalmente.

Usar estado local quando a informação pertence apenas ao componente.

Usar contexto ou solução global apenas quando realmente necessário.

---

# 78. Loading e erros

Toda operação assíncrona relevante deve considerar:

```text
Loading
Success
Error
Empty
```

Não deixar o usuário sem feedback.

---

# 79. Formulários

Formulários devem:

* validar dados;
* impedir submissões inválidas;
* apresentar erros;
* indicar carregamento;
* evitar duplicidade de envio;
* limpar ou manter estado de acordo com o comportamento esperado.

---

# 80. Tabelas

Tabelas financeiras devem apresentar valores claramente.

Exemplo:

```text
R$ 40,00
R$ 15,00
R$ 1.250,50
```

A formatação é responsabilidade da apresentação.

O valor bruto vindo da API não deve ser alterado de forma que comprometa cálculos posteriores.

---

# 81. Separação entre valor e apresentação

Evitar armazenar:

```text
"R$ 40,00"
```

como valor financeiro.

Preferir:

```text
40.00
```

ou `Decimal`, conforme o padrão do banco.

A interface transforma em:

```text
R$ 40,00
```

---

# 82. Relatório público e privacidade

O relatório público deve disponibilizar somente informações que realmente precisam ser públicas.

Não expor informações administrativas ou financeiras individuais que não estejam previstas pelo domínio.

Antes de incluir qualquer campo no relatório público, avaliar:

```text
Esse dado precisa ser público?
```

---

# 83. Critério de pronto

Uma tarefa não deve ser considerada concluída apenas porque o código compila.

Deve verificar:

```text
[ ] Funcionalidade implementada
[ ] Regra de negócio preservada
[ ] Tipagem correta
[ ] Validação implementada
[ ] Segurança considerada
[ ] API funcionando
[ ] Frontend funcionando
[ ] Estados de loading tratados
[ ] Erros tratados
[ ] Testes relevantes executados
[ ] Banco consistente
[ ] README atualizado quando necessário
```

---

# 84. Checklist de implementação

Antes de finalizar uma tarefa:

* [ ] Li o `README.md`.
* [ ] Entendi o objetivo da alteração.
* [ ] Localizei o domínio afetado.
* [ ] Procurei implementações existentes.
* [ ] Verifiquei regras de negócio.
* [ ] Verifiquei o schema Prisma.
* [ ] Verifiquei endpoints relacionados.
* [ ] Verifiquei services relacionados.
* [ ] Verifiquei componentes relacionados.
* [ ] Verifiquei testes existentes.
* [ ] Avaliei impacto em dados existentes.
* [ ] Mantive TypeScript seguro.
* [ ] Evitei duplicação.
* [ ] Mantive regras financeiras centralizadas.
* [ ] Considerei autenticação.
* [ ] Considerei autorização.
* [ ] Tratei erros.
* [ ] Testei a alteração.
* [ ] Verifiquei regressões.
* [ ] Atualizei documentação se necessário.

---

# 85. Checklist específico para financeiro

Antes de alterar qualquer funcionalidade financeira:

* [ ] O valor possui uma única fonte de verdade?
* [ ] O cálculo utiliza precisão adequada?
* [ ] O valor afeta o saldo?
* [ ] O valor afeta relatórios?
* [ ] O valor afeta cobranças?
* [ ] O valor afeta histórico?
* [ ] O pagamento pode ser duplicado?
* [ ] Existe necessidade de transação?
* [ ] Existe impacto em registros antigos?
* [ ] Existem testes para o cálculo?

---

# 86. Checklist específico para autenticação

Antes de alterar autenticação:

* [ ] Senha continua protegida com hash?
* [ ] JWT continua seguro?
* [ ] Token é validado?
* [ ] Rotas protegidas continuam protegidas?
* [ ] Usuário não autenticado recebe 401?
* [ ] Usuário autenticado sem permissão recebe 403?
* [ ] Dados sensíveis não são retornados?
* [ ] Frontend trata sessão expirada?

---

# 87. Checklist específico para banco

Antes de alterar o banco:

* [ ] Modelo existente foi analisado?
* [ ] Relacionamentos foram analisados?
* [ ] Enum foi analisado?
* [ ] Migration é necessária?
* [ ] Dados existentes serão afetados?
* [ ] Código Prisma foi atualizado?
* [ ] Services foram atualizados?
* [ ] Testes foram atualizados?
* [ ] O comportamento de exclusão foi analisado?

---

# 88. Checklist específico para frontend

Antes de finalizar uma funcionalidade:

* [ ] Componente reutilizável foi considerado?
* [ ] Tipos foram definidos?
* [ ] Loading existe?
* [ ] Erro existe?
* [ ] Estado vazio existe?
* [ ] Feedback de sucesso existe?
* [ ] Formulário possui validação?
* [ ] API está sendo chamada corretamente?
* [ ] Regras de negócio não foram duplicadas?
* [ ] Interface está consistente com o restante do painel?

---

# 89. Como a IA deve responder ao implementar

Para alterações relevantes, a IA deve apresentar um resumo semelhante a:

```text
## Análise

Domínio afetado:
Pagamentos

Regra envolvida:
Mensalista = R$ 40,00

Arquivos analisados:
- ...
- ...
- ...

Impacto:
- API
- Banco
- Dashboard

Implementação:
- ...

Testes:
- ...

Riscos:
- ...
```

Isso torna a alteração auditável.

---

# 90. Como a IA deve tratar dúvidas

Quando houver ambiguidade relevante, a IA deve separar:

```text
Fato existente
```

de:

```text
Decisão nova
```

Exemplo:

```text
Fato:
O sistema atualmente considera mensalista como R$ 40,00.

Dúvida:
A nova funcionalidade deve manter R$ 40,00 ou permitir configuração?

Decisão necessária:
Definir se o valor será fixo ou configurável.
```

Não inventar uma regra sem necessidade.

---

# 91. Prioridade das decisões

Quando houver conflito, considerar:

```text
1. Segurança
2. Integridade dos dados
3. Regras de negócio
4. Compatibilidade
5. Arquitetura existente
6. Testabilidade
7. Manutenibilidade
8. Performance
9. Conveniência de implementação
```

Uma solução mais rápida não deve comprometer integridade financeira ou segurança.

---

# 92. O que a IA deve evitar

Evitar:

* criar código duplicado;
* criar regras no frontend;
* usar `any`;
* ignorar erros TypeScript;
* ignorar testes;
* alterar schema sem analisar impacto;
* alterar regras silenciosamente;
* criar endpoints duplicados;
* colocar senha no código;
* colocar secrets no Git;
* fazer cálculos financeiros espalhados;
* apagar histórico financeiro sem analisar impacto;
* usar valores mágicos;
* fazer refatorações gigantes sem necessidade;
* modificar arquitetura sem justificativa;
* assumir comportamento não documentado.

---

# 93. Filosofia do projeto

O sistema Futebol deve evoluir de maneira incremental.

A regra é:

> **Entender antes de alterar.**

E também:

> **Centralizar regras antes de duplicá-las.**

E:

> **Preservar comportamento antes de refatorar.**

E:

> **Dados financeiros devem ser tratados como dados críticos.**

E:

> **O frontend apresenta; a API decide.**

---

# 94. Fluxo padrão de desenvolvimento

O fluxo recomendado é:

```text
Solicitação
    ↓
Ler README
    ↓
Entender domínio
    ↓
Pesquisar código existente
    ↓
Identificar regra
    ↓
Avaliar impacto
    ↓
Definir solução
    ↓
Criar/ajustar teste
    ↓
Implementar
    ↓
Executar testes
    ↓
Validar API
    ↓
Validar frontend
    ↓
Revisar segurança
    ↓
Revisar banco
    ↓
Atualizar documentação
    ↓
Finalizar
```

---

# 95. Exemplo de fluxo completo

Imagine a solicitação:

> "Adicionar pagamento de mensalidade."

A IA deve analisar:

```text
Pagamento
 ↓
Jogador
 ↓
Tipo de jogador
 ↓
Valor
 ↓
Cobrança
 ↓
Status
 ↓
Caixa
 ↓
Relatório
```

Depois verificar:

```text
Existe endpoint?
Existe service?
Existe model Prisma?
Existe enum?
Existe componente?
Existe formulário?
Existe relatório?
Existe teste?
```

Somente depois implementar.

---

# 96. Exemplo de impacto

Uma alteração aparentemente simples:

> "Alterar valor da mensalidade."

Pode afetar:

```text
Regra financeira
        ↓
Cobranças
        ↓
Pagamentos
        ↓
Saldo
        ↓
Relatório mensal
        ↓
Dashboard
        ↓
Relatório público
        ↓
Testes
```

Por isso, a IA deve sempre avaliar o impacto antes de modificar.

---

# 97. Documentação viva

Este documento deve evoluir junto com o projeto.

Quando uma nova regra de negócio se tornar permanente, deve ser avaliada a inclusão neste documento.

Exemplos:

```text
Novo tipo de jogador
Novo tipo de pagamento
Novo status
Nova regra de rateio
Nova regra de cobrança
Nova regra de fechamento
Nova permissão
Novo relatório
```

A documentação deve refletir o sistema real.

---

# 98. Não usar este documento para congelar o projeto

Este documento não deve impedir evolução.

Ele existe para garantir que mudanças sejam conscientes.

Se uma nova arquitetura for necessária, ela pode ser adotada.

Porém, deve existir uma justificativa clara:

```text
Problema atual
 ↓
Motivo da mudança
 ↓
Nova solução
 ↓
Impacto
 ↓
Plano de migração
```

---

# 99. Regra final para a IA

Antes de modificar qualquer parte do projeto Futebol, a IA deve pensar:

> **"Eu entendi o que esse código representa no domínio?"**

Depois:

> **"Existe alguma regra existente que minha alteração pode quebrar?"**

Depois:

> **"Estou colocando a regra no lugar correto?"**

Depois:

> **"Estou duplicando alguma lógica que já existe?"**

Depois:

> **"Minha alteração mantém segurança, consistência financeira, tipagem e arquitetura?"**

E finalmente:

> **"Eu testei o comportamento que alterei?"**

---

# 100. Resumo executivo

O **Futebol** é um sistema de gestão de um time de futebol amador com foco em:

```text
JOGADORES
    ↓
MENSALISTAS / CONVIDADOS
    ↓
COBRANÇAS
    ↓
PAGAMENTOS
    ↓
ENTRADAS
    ↓
DESPESAS
    ↓
SAÍDAS
    ↓
CAIXA
    ↓
SALDO
    ↓
RELATÓRIOS
```

A arquitetura é dividida entre:

```text
API
Express + TypeScript + Prisma + PostgreSQL

        ↕ HTTP

PAINEL WEB
Next.js + React + TypeScript
```

A **API concentra as regras de negócio**.

O **frontend concentra apresentação e interação**.

O **Prisma representa o acesso ao banco**.

As **regras financeiras devem ser centralizadas**.

A **autenticação e autorização devem ser tratadas como requisitos de segurança**.

O **histórico financeiro deve ser preservado quando o domínio exigir**.

Alterações devem ser **incrementais, testáveis e compatíveis com o sistema existente**.

---

# 101. Instrução final para agentes de IA

Ao trabalhar neste projeto:

```text
LEIA
 ↓
ENTENDA
 ↓
PESQUISE
 ↓
ANALISE
 ↓
PLANEJE
 ↓
TESTE
 ↓
IMPLEMENTE
 ↓
VALIDE
 ↓
DOCUMENTE
```

Nunca:

```text
RECEBEU PEDIDO
 ↓
ESCREVEU CÓDIGO
```

A qualidade do projeto depende de a IA compreender o domínio antes de modificar sua implementação.

**Fonte principal de contexto funcional:** `README.md`

**Fonte principal das regras persistidas:** `schema.prisma`

**Fonte principal das regras de negócio:** `services/`

**Fonte principal da interface:** `futebol-web/`

**Fonte principal de validação comportamental:** `tests/`

---

## Status do documento

**Projeto:** Futebol
**Tipo:** Sistema Web de Gestão de Time de Futebol Amador
**Documento:** Contexto e Diretrizes para IA
**Objetivo:** Contextualização e desenvolvimento assistido por IA
**Prioridade:** Arquitetura, segurança, consistência financeira, tipagem e manutenção
**Regra principal:** compreender o sistema antes de modificar o sistema.
