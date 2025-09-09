import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { BasePaginatedQueryDto } from '@/common/dto/pagination.dto'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { RoleName } from '@/constants/role'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { CreateTeamReqDto, UpdateTeamReqDto } from './dto'
import { TeamUtilsService } from './utils.service'

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly teamUtilsService: TeamUtilsService,
  ) {}

  async createTeam(createTeamDto: CreateTeamReqDto, creatorId: string) {
    const { name, slug, description, avatar } = createTeamDto

    try {
      await this.teamUtilsService.checkTeamNameExists(name)

      await this.teamUtilsService.checkTeamSlugExists(slug)

      const ownerRole = await this.prisma.role.findUnique({
        where: { name: RoleName.TEAM_OWNER },
      })

      if (!ownerRole) {
        throw new HanaException('系统角色配置错误', ErrorCode.ROLE_NOT_FOUND)
      }

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
      throw new HanaException('创建团队失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async getUserTeams(userId: string, query: BasePaginatedQueryDto) {
    const { page = 1, limit = 10, search } = query

    try {
      const skip = (page - 1) * limit

      // 构建查询条件
      const whereCondition: Prisma.TeamWhereInput = {
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
      throw new HanaException('获取团队列表失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async getTeamDetail(teamId: string, userId: string) {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
            take: 10, // 限制显示的成员数量
          },
          projects: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              icon: true,
              createdAt: true,
            },
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
        throw new HanaException('团队不存在', ErrorCode.TEAM_NOT_FOUND, 404)
      }

      if (!team.isActive) {
        throw new HanaException('团队已被禁用', ErrorCode.TEAM_DISABLED)
      }

      // 检查用户是否是团队成员
      const currentUserMember = team.members.find(member => member.userId === userId)
      if (!currentUserMember) {
        throw new HanaException('您不是该团队的成员', ErrorCode.NOT_TEAM_MEMBER, 403)
      }

      return team
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`获取团队详情失败: ${error.message}`, error.stack)
      throw new HanaException('获取团队详情失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async updateTeam(teamId: string, updateTeamDto: UpdateTeamReqDto, userId: string) {
    try {
      // 检查团队是否存在
      const existingTeam = await this.teamUtilsService.getTeamById(teamId)

      // 验证用户权限（需要在控制器层通过权限守卫验证）
      await this.teamUtilsService.checkUserTeamMembership(teamId, userId)

      // 如果要更新名称，检查是否重复
      if (updateTeamDto.name && updateTeamDto.name !== existingTeam.name) {
        await this.teamUtilsService.checkTeamNameExists(updateTeamDto.name)
      }

      // 更新团队信息
      const updatedTeam = await this.prisma.team.update({
        where: { id: teamId },
        data: {
          ...(updateTeamDto.name && { name: updateTeamDto.name }),
          ...(updateTeamDto.description !== undefined && { description: updateTeamDto.description }),
          ...(updateTeamDto.avatar !== undefined && { avatar: updateTeamDto.avatar }),
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
      throw new HanaException('更新团队信息失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async deleteTeam(teamId: string, userId: string) {
    try {
      // 检查团队是否存在
      const team = await this.teamUtilsService.getTeamById(teamId)

      // 验证用户权限（需要在控制器层通过权限守卫验证）
      await this.teamUtilsService.checkUserTeamMembership(teamId, userId)

      // 检查团队是否有项目
      const projectCount = await this.prisma.project.count({
        where: {
          teamId,
          status: 'ACTIVE',
        },
      })

      if (projectCount > 0) {
        throw new HanaException('无法删除包含项目的团队', ErrorCode.CANNOT_DELETE_TEAM_WITH_PROJECTS)
      }

      // 软删除团队（设置为非激活状态）
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
      throw new HanaException('删除团队失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }
}
