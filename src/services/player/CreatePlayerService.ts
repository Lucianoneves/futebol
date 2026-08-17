import prismaClient from "../../prisma";
import { isPlayerType, resolvePlayerFees } from "./playerFees";

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

    if (!isPlayerType(type)) {
      throw new Error("Tipo deve ser MONTHLY, CASUAL ou FEES");
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
