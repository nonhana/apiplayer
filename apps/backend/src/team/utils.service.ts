import { Injectable } from '@nestjs/common'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class TeamUtilsService {
  constructor(private readonly prisma: PrismaService) {}

  async checkTeamNameExists(name: string) {
    const existingTeam = await this.prisma.team.findFirst({
      where: {
        name,
        isActive: true,
      },
    })

    if (existingTeam) {
      throw new HanaException('TEAM_NAME_EXISTS')
    }
  }

  async checkTeamSlugExists(slug: string) {
    const existingTeam = await this.prisma.team.findUnique({
      where: { slug },
    })

    if (existingTeam) {
      throw new HanaException('TEAM_SLUG_EXISTS')
    }
  }

  async getTeamById(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    })

    if (!team) {
      throw new HanaException('TEAM_NOT_FOUND')
    }

    if (!team.isActive) {
      throw new HanaException('TEAM_DISABLED')
    }

    return team
  }

  async checkUserTeamMembership(teamId: string, userId: string) {
    const membership = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    })

    if (!membership) {
      throw new HanaException('NOT_TEAM_MEMBER')
    }
  }
}
