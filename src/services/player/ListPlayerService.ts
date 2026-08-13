import prismaClient from "../../prisma";

interface ListPlayerRequest {
  active?: boolean;
}

class ListPlayerService {
  async execute({ active }: ListPlayerRequest) {
    const players = await prismaClient.player.findMany({
      where: {
        ...(active !== undefined && { active }),
      },
      orderBy: {
        name: "asc",
      },
    });

    return players;
  }
}

export { ListPlayerService };
