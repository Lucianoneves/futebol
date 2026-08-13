import prismaClient from "../../prisma";
import { ensureExpenseTypes } from "./expenseTypes";

interface CreateExpenseTypeRequest {
  name: string;
}

class CreateExpenseTypeService {
  async execute({ name }: CreateExpenseTypeRequest) {
    if (!name?.trim()) {
      throw new Error("Nome do tipo de despesa é obrigatório");
    }

    await ensureExpenseTypes();

    const normalized = name.trim();

    const alreadyExists = await prismaClient.expenseType.findFirst({
      where: {
        name: {
          equals: normalized,
          mode: "insensitive",
        },
      },
    });

    if (alreadyExists) {
      if (!alreadyExists.active) {
        const reactivated = await prismaClient.expenseType.update({
          where: { id: alreadyExists.id },
          data: { active: true },
        });

        return {
          id: reactivated.id,
          name: reactivated.name,
          active: reactivated.active,
        };
      }

      throw new Error("Tipo de despesa já cadastrado");
    }

    const created = await prismaClient.expenseType.create({
      data: { name: normalized },
    });

    return {
      id: created.id,
      name: created.name,
      active: created.active,
    };
  }
}

export { CreateExpenseTypeService };
