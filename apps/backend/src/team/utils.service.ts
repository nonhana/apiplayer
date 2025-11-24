import { Injectable } from '@nestjs/common'
import { ErrorCode } from '@/common/exceptions/error-code'
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
      throw new HanaException('团队名称已存在', ErrorCode.TEAM_NAME_EXISTS)
    }
  }

  async checkTeamSlugExists(slug: string) {
    const existingTeam = await this.prisma.team.findUnique({
      where: { slug },
    })

    if (existingTeam) {
      throw new HanaException('团队标识符已存在', ErrorCode.TEAM_SLUG_EXISTS)
    }
  }

  async getTeamById(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    })

    if (!team) {
      throw new HanaException('团队不存在', ErrorCode.TEAM_NOT_FOUND, 404)
    }

    if (!team.isActive) {
      throw new HanaException('团队已被禁用', ErrorCode.TEAM_DISABLED)
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
      throw new HanaException('您不是该团队的成员', ErrorCode.NOT_TEAM_MEMBER, 403)
    }
  }
}
