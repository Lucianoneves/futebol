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
      include: {
        user: {
          select: {
            email: true,
            active: true,
            role: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return players.map(({ user, ...player }) => ({
      ...player,
      hasAccess: Boolean(user?.active && user.role === "PLAYER"),
      accessEmail: user?.email || null,
    }));
  }
}

export { ListPlayerService };
