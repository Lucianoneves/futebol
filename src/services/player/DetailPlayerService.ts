import prismaClient from "../../prisma";

interface DetailPlayerRequest {
  player_id: string;
}

class DetailPlayerService {
  async execute({ player_id }: DetailPlayerRequest) {
    if (!player_id) {
      throw new Error("ID do jogador é obrigatório");
    }

    const player = await prismaClient.player.findFirst({
      where: {
        id: player_id,
      },
    });

    if (!player) {
      throw new Error("Jogador não encontrado");
    }

    return player;
  }
}

export { DetailPlayerService };
