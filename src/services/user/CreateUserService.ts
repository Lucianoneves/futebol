import { hash } from "bcryptjs";
import prismaClient from "../../prisma";
import { Role } from "../../generated/prisma/enums";

interface UserRequest {
  name: string;
  email: string;
  password: string;
}

class CreateUserService {
  async execute({ name, email, password }: UserRequest) {
    if (!name || !email || !password) {
      throw new Error("Name, email and password are required");
    }

    const userAlreadyExists = await prismaClient.user.findFirst({
      where: {
        email,
      },
    });

    if (userAlreadyExists) {
      throw new Error("Email/user already registered");
    }

    const usersCount = await prismaClient.user.count();
    const passwordHash = await hash(password, 8);

    const user = await prismaClient.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: usersCount === 0 ? Role.ADMIN : Role.USER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }
}

export { CreateUserService };
