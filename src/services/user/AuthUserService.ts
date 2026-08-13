import prismaClient from "../../prisma";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";

interface AuthUserRequest {
  email: string;
  password: string;
}

class AuthUserService {
  async execute({ email, password }: AuthUserRequest) {
    const user = await prismaClient.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new Error("User/password incorrect");
    }

    if (!user.active) {
      throw new Error("Usuário desativado");
    }

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      throw new Error("Email/password incorrect");
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
        expiresIn: "30d",
      }
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      playerId: user.playerId,
      token: token,
    };
  }
}

export { AuthUserService };
