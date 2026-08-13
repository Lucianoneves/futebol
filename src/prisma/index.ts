import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prismaClient = new PrismaClient({ adapter });

export const expenseInclude = {
  expenseType: true,
  cashFlow: true,
} as const;

export async function deleteCashFlowIfPresent(
  cashFlow: { id: string } | null | undefined
) {
  if (!cashFlow) return;

  await prismaClient.cashFlow.delete({
    where: { id: cashFlow.id },
  });
}

export default prismaClient;
