import prismaClient from "../../prisma";

interface ActivatePlayerRequest {
  player_id: string;
}

class ActivatePlayerService {
  async execute({ player_id }: ActivatePlayerRequest) {
    if (!player_id) {
      throw new Error("ID do jogador é obrigatório");
    }

    const player = await prismaClient.player.findFirst({
      where: { id: player_id },
    });

    if (!player) {
      throw new Error("Jogador não encontrado");
    }

    if (player.active) {
      throw new Error("Jogador já está ativo");
    }

    const playerActivated = await prismaClient.player.update({
      where: { id: player_id },
      data: {
        active: true,
      },
    });

    await prismaClient.user.updateMany({
      where: { playerId: player_id },
      data: { active: true },
    });

    return playerActivated;
  }
}

export { ActivatePlayerService };
