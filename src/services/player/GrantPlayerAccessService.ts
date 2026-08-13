import { hash } from "bcryptjs";
import prismaClient from "../../prisma";
import { Role } from "../../generated/prisma/enums";

interface GrantPlayerAccessRequest {
  player_id: string;
  email: string;
  password: string;
}

class GrantPlayerAccessService {
  async execute({ player_id, email, password }: GrantPlayerAccessRequest) {
    if (!player_id || !email || !password) {
      throw new Error("Jogador, e-mail e senha são obrigatórios");
    }

    if (password.length < 6) {
      throw new Error("Senha deve ter no mínimo 6 caracteres");
    }

    const player = await prismaClient.player.findFirst({
      where: { id: player_id },
      include: { user: true },
    });

    if (!player) {
      throw new Error("Jogador não encontrado");
    }

    if (!player.active) {
      throw new Error("Jogador está desativado");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await hash(password, 8);

    const emailOwner = await prismaClient.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
      },
    });

    if (emailOwner && emailOwner.playerId !== player_id) {
      throw new Error("Este e-mail já está em uso");
    }

    if (emailOwner && emailOwner.role !== Role.PLAYER) {
      throw new Error("Este e-mail pertence à gestão do time");
    }

    const user = player.user
      ? await prismaClient.user.update({
          where: { id: player.user.id },
          data: {
            name: player.name,
            email: normalizedEmail,
            password: passwordHash,
            role: Role.PLAYER,
            active: true,
            playerId: player.id,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            playerId: true,
          },
        })
      : await prismaClient.user.create({
          data: {
            name: player.name,
            email: normalizedEmail,
            password: passwordHash,
            role: Role.PLAYER,
            playerId: player.id,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            playerId: true,
          },
        });

    if (player.email !== normalizedEmail) {
      await prismaClient.player.update({
        where: { id: player.id },
        data: { email: normalizedEmail },
      });
    }

    return user;
  }
}

export { GrantPlayerAccessService };
