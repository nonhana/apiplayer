import { ROLE_NAME } from '@apiplayer/shared'
import { Injectable, Logger } from '@nestjs/common'
import { TeamWhereInput } from 'prisma/generated/models'
import { BasePaginatedQueryDto } from '@/common/dto/pagination.dto'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { RoleService } from '@/role/role.service'
import { CreateTeamReqDto, UpdateTeamReqDto } from './dto'
import { TeamUtilsService } from './utils.service'

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly teamUtilsService: TeamUtilsService,
    private readonly roleService: RoleService,
  ) {}

  async createTeam(dto: CreateTeamReqDto, creatorId: string) {
    const { name, slug, description, avatar } = dto

    try {
      await this.teamUtilsService.checkTeamNameExists(name)
      await this.teamUtilsService.checkTeamSlugExists(slug)

      const ownerRole = await this.roleService.getRole('name', ROLE_NAME.TEAM_OWNER)

      const result = await this.prisma.$transaction(async (tx) => {
        const team = await tx.team.create({
          data: {
            name,
            slug,
            description,
            avatar,
          },
        })

        await tx.teamMember.create({
          data: {
            userId: creatorId,
            teamId: team.id,
            roleId: ownerRole.id,
          },
        })

        return team
      })

      this.logger.log(`用户 ${creatorId} 创建了团队 ${result.name} (${result.id})`)

      return result
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`创建团队失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 获取用户的全部团队列表（不分页，用于选择器等场景） */
  async getAllUserTeams(userId: string) {
    try {
      const teams = await this.prisma.team.findMany({
        where: {
          isActive: true,
          members: {
            some: { userId },
          },
        },
        include: {
          members: {
            where: { userId },
            include: {
              role: true,
            },
          },
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return teams
    }
    catch (error) {
      this.logger.error(`获取用户全部团队列表失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  async getUserTeams(dto: BasePaginatedQueryDto, userId: string) {
    const { page = 1, limit = 10, search } = dto

    try {
      const skip = (page - 1) * limit

      // 构建查询条件
      const whereCondition: TeamWhereInput = {
        isActive: true,
        members: {
          some: {
            userId,
          },
        },
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      }

      // 查询团队列表和总数
      const [teams, total] = await Promise.all([
        this.prisma.team.findMany({
          where: whereCondition,
          include: {
            members: {
              where: { userId },
              include: {
                role: true,
              },
            },
            _count: {
              select: {
                members: true,
                projects: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.team.count({ where: whereCondition }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        teams,
        total,
        pagination: {
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    }
    catch (error) {
      this.logger.error(`获取用户团队列表失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  async getTeamDetail(teamId: string) {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            include: {
              user: true,
              role: true,
            },
            orderBy: { joinedAt: 'asc' },
            take: 10, // 限制显示的成员数量
          },
          projects: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 5, // 限制显示的项目数量
          },
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
      })

      if (!team) {
        throw new HanaException('TEAM_NOT_FOUND')
      }

      if (!team.isActive) {
        throw new HanaException('TEAM_DISABLED')
      }

      return team
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error(`获取团队详情失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  async updateTeam(dto: UpdateTeamReqDto, teamId: string, userId: string) {
    try {
      const existingTeam = await this.teamUtilsService.getTeamById(teamId)

      // 如果要更新名称，检查是否重复
      if (dto.name && dto.name !== existingTeam.name) {
        await this.teamUtilsService.checkTeamNameExists(dto.name)
      }

      // 更新团队信息
      const updatedTeam = await this.prisma.team.update({
        where: { id: teamId },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        },
      })

      this.logger.log(`用户 ${userId} 更新了团队 ${updatedTeam.name} (${teamId})`)

      return updatedTeam
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`更新团队信息失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  async deleteTeam(teamId: string, userId: string) {
    try {
      const team = await this.teamUtilsService.getTeamById(teamId)

      const projectCount = await this.prisma.project.count({
        where: {
          teamId,
          status: 'ACTIVE',
        },
      })

      if (projectCount > 0) {
        throw new HanaException('CANNOT_DELETE_TEAM_WITH_PROJECTS')
      }

      // 软删除
      await this.prisma.team.update({
        where: { id: teamId },
        data: { isActive: false },
      })

      this.logger.log(`用户 ${userId} 删除了团队 ${team.name} (${teamId})`)

      return {
        deletedTeamId: teamId,
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error(`删除团队失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }
}
