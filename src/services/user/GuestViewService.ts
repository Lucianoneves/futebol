import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import prismaClient from "../../prisma";
import { Role } from "../../generated/prisma/enums";

const GUEST_EMAIL = "visitante@futebol.local";
const GUEST_NAME = "Visitante";

class GuestViewService {
  async execute() {
    const hasAdmin = await prismaClient.user.findFirst({
      where: { role: Role.ADMIN, active: true },
      select: { id: true },
    });

    if (!hasAdmin) {
      throw new Error("Painel ainda não configurado");
    }

    let user = await prismaClient.user.findFirst({
      where: { email: GUEST_EMAIL },
    });

    if (!user) {
      const passwordHash = await hash(randomBytes(24).toString("hex"), 8);
      user = await prismaClient.user.create({
        data: {
          name: GUEST_NAME,
          email: GUEST_EMAIL,
          password: passwordHash,
          role: Role.USER,
        },
      });
    }

    if (!user.active) {
      throw new Error("Acesso de visitante desativado");
    }

    if (user.role !== Role.USER) {
      throw new Error("Acesso de visitante indisponível");
    }

    const token = sign(
      {
        name: user.name,
        email: user.email,
        role: user.role,
        playerId: user.playerId,
      },
      process.env.JWT_SECRET as string,
      {
        subject: user.id,
        expiresIn: "1d",
      }
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      playerId: user.playerId,
      token,
    };
  }
}

export { GuestViewService };
