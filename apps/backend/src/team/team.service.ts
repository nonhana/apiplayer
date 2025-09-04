import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { RoleName } from '@/constants/role'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { CreateTeamDto } from './dto/create-team.dto'
import { InviteMemberDto } from './dto/invite-member.dto'
import { QueryMemberDto } from './dto/query-member.dto'
import { QueryTeamsDto } from './dto/query-teams.dto'
import { UpdateMemberDto } from './dto/update-member.dto'
import { UpdateTeamDto } from './dto/update-team.dto'

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name)

  constructor(private readonly prisma: PrismaService) {}

  async createTeam(createTeamDto: CreateTeamDto, creatorId: string) {
    const { name, slug, description, avatar } = createTeamDto

    try {
      await this.checkTeamNameExists(name)

      await this.checkTeamSlugExists(slug)

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

  async getUserTeams(userId: string, query: QueryTeamsDto) {
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

  async updateTeam(teamId: string, updateTeamDto: UpdateTeamDto, userId: string) {
    try {
      // 检查团队是否存在
      const existingTeam = await this.getTeamById(teamId)

      // 验证用户权限（需要在控制器层通过权限守卫验证）
      await this.checkUserTeamMembership(teamId, userId)

      // 如果要更新名称，检查是否重复
      if (updateTeamDto.name && updateTeamDto.name !== existingTeam.name) {
        await this.checkTeamNameExists(updateTeamDto.name)
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
      const team = await this.getTeamById(teamId)

      // 验证用户权限（需要在控制器层通过权限守卫验证）
      await this.checkUserTeamMembership(teamId, userId)

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
        message: '团队删除成功',
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

  async inviteTeamMember(teamId: string, inviteDto: InviteMemberDto, inviterId: string) {
    const { email, roleId, nickname } = inviteDto

    try {
      // 检查团队是否存在
      await this.getTeamById(teamId)

      // 验证邀请者权限
      await this.checkUserTeamMembership(teamId, inviterId)

      // 查找被邀请的用户
      const invitedUser = await this.prisma.user.findUnique({
        where: { email },
      })

      if (!invitedUser) {
        throw new HanaException('被邀请的用户不存在', ErrorCode.USER_NOT_FOUND, 404)
      }

      if (!invitedUser.isActive) {
        throw new HanaException('被邀请的用户账号已被禁用', ErrorCode.ACCOUNT_DISABLED)
      }

      // 检查用户是否已经是团队成员
      const existingMember = await this.prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: invitedUser.id,
            teamId,
          },
        },
      })

      if (existingMember) {
        throw new HanaException('用户已经是团队成员', ErrorCode.USER_ALREADY_TEAM_MEMBER)
      }

      // 验证角色是否存在
      const role = await this.prisma.role.findUnique({
        where: { id: roleId },
      })

      if (!role) {
        throw new HanaException('指定的角色不存在', ErrorCode.ROLE_NOT_FOUND, 404)
      }

      // 创建团队成员关系
      const newTeamMember = await this.prisma.teamMember.create({
        data: {
          userId: invitedUser.id,
          teamId,
          roleId,
          nickname,
        },
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
      })

      this.logger.log(`用户 ${inviterId} 邀请了用户 ${invitedUser.username} 加入团队 ${teamId}`)

      return newTeamMember
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`邀请团队成员失败: ${error.message}`, error.stack)
      throw new HanaException('邀请团队成员失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async getTeamMembers(teamId: string, userId: string, query: QueryMemberDto) {
    const { page = 1, limit = 10, search } = query

    try {
      // 检查团队是否存在和用户权限
      await this.getTeamById(teamId)
      await this.checkUserTeamMembership(teamId, userId)

      const skip = (page - 1) * limit

      // 构建搜索条件
      const searchCondition: Prisma.TeamMemberWhereInput = search
        ? {
            OR: [
              { user: { username: { contains: search, mode: 'insensitive' as const } } },
              { user: { name: { contains: search, mode: 'insensitive' as const } } },
              { user: { email: { contains: search, mode: 'insensitive' as const } } },
              { nickname: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}

      // 查询成员列表和总数
      const [members, total] = await Promise.all([
        this.prisma.teamMember.findMany({
          where: {
            teamId,
            ...searchCondition,
          },
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
          skip,
          take: limit,
          orderBy: { joinedAt: 'asc' },
        }),
        this.prisma.teamMember.count({
          where: {
            teamId,
            ...searchCondition,
          },
        }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        members,
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
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`获取团队成员列表失败: ${error.message}`, error.stack)
      throw new HanaException('获取团队成员列表失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async updateTeamMemberRole(teamId: string, memberId: string, updateDto: UpdateMemberDto, operatorId: string) {
    const { roleId, nickname } = updateDto

    try {
      // 检查团队是否存在
      await this.getTeamById(teamId)

      // 验证操作者权限
      await this.checkUserTeamMembership(teamId, operatorId)

      // 查找要更新的成员
      const member = await this.prisma.teamMember.findUnique({
        where: { id: memberId },
        include: {
          user: true,
          role: true,
        },
      })

      if (!member || member.teamId !== teamId) {
        throw new HanaException('团队成员不存在', ErrorCode.TEAM_MEMBER_NOT_FOUND, 404)
      }

      // 检查是否尝试修改团队所有者角色
      if (member.role.name === 'team:owner') {
        throw new HanaException('不能修改团队所有者的角色', ErrorCode.CANNOT_MODIFY_OWNER_ROLE)
      }

      // 验证新角色是否存在
      const newRole = await this.prisma.role.findUnique({
        where: { id: roleId },
      })

      if (!newRole) {
        throw new HanaException('指定的角色不存在', ErrorCode.ROLE_NOT_FOUND, 404)
      }

      // 更新成员角色
      const updatedMember = await this.prisma.teamMember.update({
        where: { id: memberId },
        data: {
          roleId,
          ...(nickname !== undefined && { nickname }),
        },
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
      })

      this.logger.log(`用户 ${operatorId} 更新了团队 ${teamId} 中成员 ${member.user.username} 的角色`)

      return updatedMember
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`更新团队成员角色失败: ${error.message}`, error.stack)
      throw new HanaException('更新团队成员角色失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async removeTeamMember(teamId: string, memberId: string, operatorId: string) {
    try {
      // 检查团队是否存在
      await this.getTeamById(teamId)

      // 验证操作者权限
      await this.checkUserTeamMembership(teamId, operatorId)

      // 查找要移除的成员
      const member = await this.prisma.teamMember.findUnique({
        where: { id: memberId },
        include: {
          user: true,
          role: true,
        },
      })

      if (!member || member.teamId !== teamId) {
        throw new HanaException('团队成员不存在', ErrorCode.TEAM_MEMBER_NOT_FOUND, 404)
      }

      // 检查是否尝试移除团队所有者
      if (member.role.name === 'team:owner') {
        throw new HanaException('不能移除团队所有者', ErrorCode.CANNOT_REMOVE_TEAM_OWNER)
      }

      // 移除成员
      await this.prisma.teamMember.delete({
        where: { id: memberId },
      })

      this.logger.log(`用户 ${operatorId} 从团队 ${teamId} 中移除了成员 ${member.user.username}`)

      return {
        message: '成员移除成功',
        removedMemberId: memberId,
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`移除团队成员失败: ${error.message}`, error.stack)
      throw new HanaException('移除团队成员失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  // ==================== 私有辅助方法 ====================
  private async checkTeamNameExists(name: string): Promise<void> {
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

  private async checkTeamSlugExists(slug: string): Promise<void> {
    const existingTeam = await this.prisma.team.findUnique({
      where: { slug },
    })

    if (existingTeam) {
      throw new HanaException('团队标识符已存在', ErrorCode.TEAM_SLUG_EXISTS)
    }
  }

  private async getTeamById(teamId: string) {
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

  private async checkUserTeamMembership(teamId: string, userId: string): Promise<void> {
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
