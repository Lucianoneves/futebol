import prismaClient from "../../prisma";
import { PlayerType } from "../../generated/prisma/enums";
import { resolvePlayerFees } from "./playerFees";

interface CreatePlayerRequest {
  name: string;
  type: string;
  email?: string;
  phone?: string;
}

class CreatePlayerService {
  async execute({ name, type, email, phone }: CreatePlayerRequest) {
    if (!name || !type) {
      throw new Error("Nome e tipo são obrigatórios");
    }

    if (type !== PlayerType.MONTHLY && type !== PlayerType.CASUAL) {
      throw new Error("Tipo deve ser MONTHLY ou CASUAL");
    }

    if (email) {
      const emailAlreadyExists = await prismaClient.player.findFirst({
        where: { email },
      });

      if (emailAlreadyExists) {
        throw new Error("E-mail já cadastrado para outro jogador");
      }
    }

    const fees = await resolvePlayerFees(type);

    const player = await prismaClient.player.create({
      data: {
        name,
        type,
        email: email || null,
        phone: phone || null,
        ...fees,
      },
    });

    return player;
  }
}

export { CreatePlayerService };
