-- CreateEnum
CREATE TYPE "TipoJogador" AS ENUM ('MENSALISTA', 'AVULSO');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoFluxo" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "CategoriaDespesa" AS ENUM ('CHURRASCO', 'CAMPO', 'EQUIPAMENTO', 'TRANSPORTE', 'ARBITRAGEM', 'OUTROS');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jogadores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "tipo" "TipoJogador" NOT NULL,
    "valorMensalidade" DECIMAL(10,2),
    "valorAvulso" DECIMAL(10,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jogadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL,
    "jogadorId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "pagoEm" TIMESTAMP(3),
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "despesas" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" "CategoriaDespesa" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "dataGasto" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "despesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fluxo_caixa" (
    "id" TEXT NOT NULL,
    "tipo" "TipoFluxo" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "descricao" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pagamentoId" TEXT,
    "despesaId" TEXT,

    CONSTRAINT "fluxo_caixa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "jogadores_email_key" ON "jogadores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_jogadorId_ano_mes_key" ON "pagamentos"("jogadorId", "ano", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "fluxo_caixa_pagamentoId_key" ON "fluxo_caixa"("pagamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "fluxo_caixa_despesaId_key" ON "fluxo_caixa"("despesaId");

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "jogadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_caixa" ADD CONSTRAINT "fluxo_caixa_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "pagamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_caixa" ADD CONSTRAINT "fluxo_caixa_despesaId_fkey" FOREIGN KEY ("despesaId") REFERENCES "despesas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
