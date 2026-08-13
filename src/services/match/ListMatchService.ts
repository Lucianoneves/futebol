import prismaClient from "../../prisma";
import { assertIsoDay } from "../../utils/date";
import { matchInclude, presentMatch } from "./matchInclude";

interface ListMatchRequest {
  playedOn?: string;
}

class ListMatchService {
  async execute({ playedOn }: ListMatchRequest) {
    const matches = await prismaClient.match.findMany({
      where: {
        ...(playedOn && { playedOn: assertIsoDay(playedOn) }),
      },
      include: matchInclude,
      orderBy: {
        playedOn: "desc",
      },
    });

    return matches.map(presentMatch);
  }
}

export { ListMatchService };
