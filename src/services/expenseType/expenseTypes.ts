import prismaClient from "../../prisma";

const DEFAULT_EXPENSE_TYPES = [
  "Carne",
  "Carvão",
  "Linguiça",
  "Bola de futebol",
  "Campo",
  "Árbitro",
  "Transporte",
  "Outros",
];

export async function ensureExpenseTypes() {
  const existing = await prismaClient.expenseType.findMany({
    orderBy: { name: "asc" },
  });

  if (existing.length === 0) {
    await prismaClient.expenseType.createMany({
      data: DEFAULT_EXPENSE_TYPES.map((name) => ({ name })),
    });

    return prismaClient.expenseType.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
  }

  return existing.filter((item) => item.active);
}
