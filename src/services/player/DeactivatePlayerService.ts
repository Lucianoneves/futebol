import prismaClient from "../../prisma";

interface DeactivatePlayerRequest {
  player_id: string;
}

class DeactivatePlayerService {
  async execute({ player_id }: DeactivatePlayerRequest) {
    if (!player_id) {
      throw new Error("ID do jogador é obrigatório");
    }

    const player = await prismaClient.player.findFirst({
      where: { id: player_id },
    });

    if (!player) {
      throw new Error("Jogador não encontrado");
    }

    if (!player.active) {
      throw new Error("Jogador já está desativado");
    }

    const playerDeactivated = await prismaClient.player.update({
      where: { id: player_id },
      data: {
        active: false,
      },
    });

    await prismaClient.user.updateMany({
      where: { playerId: player_id },
      data: { active: false },
    });

    return playerDeactivated;
  }
}

export { DeactivatePlayerService };
