import { Inject, Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { RoleName } from '@/constants/role'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { nullToUndefined } from '@/utils'
import {
  CreateTeamDto,
  CreateTeamResponseDto,
  InviteTeamMemberDto,
  InviteTeamMemberResponseDto,
  RemoveTeamMemberResponseDto,
  TeamDetailDto,
  TeamInfoDto,
  TeamListQueryDto,
  TeamListResponseDto,
  TeamMemberInfoDto,
  TeamMembersResponseDto,
  UpdateTeamDto,
  UpdateTeamMemberResponseDto,
  UpdateTeamMemberRoleDto,
  UpdateTeamResponseDto,
} from './dto'

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name)

  @Inject(PrismaService)
  private readonly prisma: PrismaService

  /**
   * 创建团队
   * @param createTeamDto 创建团队参数
   * @param creatorId 创建者 ID
   */
  async createTeam(createTeamDto: CreateTeamDto, creatorId: string): Promise<CreateTeamResponseDto> {
    const { name, slug, description, avatar } = createTeamDto

    try {
      // 检查团队名称是否已存在
      await this.checkTeamNameExists(name)

      // 检查团队标识符是否已存在
      await this.checkTeamSlugExists(slug)

      // 获取团队所有者角色
      const ownerRole = await this.prisma.role.findUnique({
        where: { name: RoleName.TEAM_OWNER },
      })

      if (!ownerRole) {
        throw new HanaException('系统角色配置错误', ErrorCode.ROLE_NOT_FOUND)
      }

      // 使用事务创建团队和成员关系
      const result = await this.prisma.$transaction(async (tx) => {
        // 创建团队
        const team = await tx.team.create({
          data: {
            name,
            slug,
            description,
            avatar,
          },
        })

        // 将创建者添加为团队所有者
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

      return {
        message: '团队创建成功',
        team: {
          id: result.id,
          name: result.name,
          slug: result.slug,
          description: nullToUndefined(result.description),
          avatar: nullToUndefined(result.avatar),
          createdAt: result.createdAt,
        },
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`创建团队失败: ${error.message}`, error.stack)
      throw new HanaException('创建团队失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /**
   * 获取用户的团队列表
   * @param userId 用户 ID
   * @param query 查询参数
   */
  async getUserTeams(userId: string, query: TeamListQueryDto): Promise<TeamListResponseDto> {
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

      // 转换为响应格式
      const teamList: TeamInfoDto[] = teams.map(team => ({
        id: team.id,
        name: team.name,
        slug: team.slug,
        description: nullToUndefined(team.description),
        avatar: nullToUndefined(team.avatar),
        isActive: team.isActive,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        memberCount: team._count.members,
        projectCount: team._count.projects,
        currentUserRole: team.members[0]?.role
          ? {
              id: team.members[0].role.id,
              name: team.members[0].role.name,
              description: nullToUndefined(team.members[0].role.description),
            }
          : undefined,
      }))

      const totalPages = Math.ceil(total / limit)

      return {
        teams: teamList,
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

  /**
   * 获取团队详情
   * @param teamId 团队 ID
   * @param userId 当前用户 ID
   */
  async getTeamDetail(teamId: string, userId: string): Promise<TeamDetailDto> {
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

      // 构建响应数据
      const teamDetail: TeamDetailDto = {
        id: team.id,
        name: team.name,
        slug: team.slug,
        description: nullToUndefined(team.description),
        avatar: nullToUndefined(team.avatar),
        isActive: team.isActive,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        memberCount: team._count.members,
        projectCount: team._count.projects,
        currentUserRole: {
          id: currentUserMember.role.id,
          name: currentUserMember.role.name,
          description: nullToUndefined(currentUserMember.role.description),
        },
        recentMembers: team.members.map(member => ({
          id: member.id,
          user: {
            ...member.user,
            avatar: nullToUndefined(member.user.avatar),
          },
          role: {
            id: member.role.id,
            name: member.role.name,
          },
          nickname: nullToUndefined(member.nickname),
          joinedAt: member.joinedAt,
        })),
        recentProjects: team.projects.map(project => ({
          ...project,
          description: nullToUndefined(project.description),
          icon: nullToUndefined(project.icon),
        })),
      }

      return teamDetail
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`获取团队详情失败: ${error.message}`, error.stack)
      throw new HanaException('获取团队详情失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /**
   * 更新团队信息
   * @param teamId 团队 ID
   * @param updateTeamDto 更新数据
   * @param userId 操作用户 ID
   */
  async updateTeam(teamId: string, updateTeamDto: UpdateTeamDto, userId: string): Promise<UpdateTeamResponseDto> {
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

      return {
        message: '团队信息更新成功',
        team: {
          id: updatedTeam.id,
          name: updatedTeam.name,
          slug: updatedTeam.slug,
          description: nullToUndefined(updatedTeam.description),
          avatar: nullToUndefined(updatedTeam.avatar),
          updatedAt: updatedTeam.updatedAt,
        },
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`更新团队信息失败: ${error.message}`, error.stack)
      throw new HanaException('更新团队信息失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /**
   * 删除团队
   * @param teamId 团队 ID
   * @param userId 操作用户 ID
   */
  async deleteTeam(teamId: string, userId: string): Promise<{ message: string, deletedTeamId: string }> {
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

  /**
   * 邀请团队成员
   * @param teamId 团队 ID
   * @param inviteDto 邀请信息
   * @param inviterId 邀请者 ID
   */
  async inviteTeamMember(teamId: string, inviteDto: InviteTeamMemberDto, inviterId: string): Promise<InviteTeamMemberResponseDto> {
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
      const teamMember = await this.prisma.teamMember.create({
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

      return {
        message: '成员邀请成功',
        member: {
          id: teamMember.id,
          user: {
            ...teamMember.user,
            avatar: nullToUndefined(teamMember.user.avatar),
          },
          role: {
            ...teamMember.role,
            description: nullToUndefined(teamMember.role.description),
          },
          nickname: nullToUndefined(teamMember.nickname),
          joinedAt: teamMember.joinedAt,
        },
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`邀请团队成员失败: ${error.message}`, error.stack)
      throw new HanaException('邀请团队成员失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /**
   * 获取团队成员列表
   * @param teamId 团队 ID
   * @param userId 当前用户 ID
   * @param query 查询参数
   */
  async getTeamMembers(teamId: string, userId: string, query: TeamListQueryDto): Promise<TeamMembersResponseDto> {
    const { page = 1, limit = 10, search } = query

    try {
      // 检查团队是否存在和用户权限
      await this.getTeamById(teamId)
      await this.checkUserTeamMembership(teamId, userId)

      const skip = (page - 1) * limit

      // 构建搜索条件
      const searchCondition = search
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

      const memberList: TeamMemberInfoDto[] = members.map(member => ({
        id: member.id,
        user: {
          ...member.user,
          avatar: nullToUndefined(member.user.avatar),
        },
        role: {
          ...member.role,
          description: nullToUndefined(member.role.description),
        },
        nickname: nullToUndefined(member.nickname),
        joinedAt: member.joinedAt,
      }))

      const totalPages = Math.ceil(total / limit)

      return {
        members: memberList,
        total,
        pagination: {
          page,
          limit,
          totalPages,
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

  /**
   * 更新团队成员角色
   * @param teamId 团队 ID
   * @param memberId 成员 ID
   * @param updateDto 更新数据
   * @param operatorId 操作者 ID
   */
  async updateTeamMemberRole(teamId: string, memberId: string, updateDto: UpdateTeamMemberRoleDto, operatorId: string): Promise<UpdateTeamMemberResponseDto> {
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

      return {
        message: '成员角色更新成功',
        member: {
          id: updatedMember.id,
          user: {
            ...updatedMember.user,
            avatar: nullToUndefined(updatedMember.user.avatar),
          },
          role: {
            ...updatedMember.role,
            description: nullToUndefined(updatedMember.role.description),
          },
          nickname: nullToUndefined(updatedMember.nickname),
          joinedAt: updatedMember.joinedAt,
        },
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`更新团队成员角色失败: ${error.message}`, error.stack)
      throw new HanaException('更新团队成员角色失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /**
   * 移除团队成员
   * @param teamId 团队 ID
   * @param memberId 成员 ID
   * @param operatorId 操作者 ID
   */
  async removeTeamMember(teamId: string, memberId: string, operatorId: string): Promise<RemoveTeamMemberResponseDto> {
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
  /**
   * 检查团队名称是否已存在
   * @param name 团队名称
   */
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

  /**
   * 检查团队标识符是否已存在
   * @param slug 团队标识符
   */
  private async checkTeamSlugExists(slug: string): Promise<void> {
    const existingTeam = await this.prisma.team.findUnique({
      where: { slug },
    })

    if (existingTeam) {
      throw new HanaException('团队标识符已存在', ErrorCode.TEAM_SLUG_EXISTS)
    }
  }

  /**
   * 根据 ID 获取团队信息
   * @param teamId 团队 ID
   */
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

  /**
   * 检查用户是否为团队成员
   * @param teamId 团队 ID
   * @param userId 用户 ID
   */
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

  /**
   * 获取用户在团队中的角色和权限
   * @param teamId 团队 ID
   * @param userId 用户 ID
   */
  async getUserTeamRole(teamId: string, userId: string): Promise<{ role: any, permissions: string[] }> {
    try {
      const membership = await this.prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      })

      if (!membership) {
        throw new HanaException('您不是该团队的成员', ErrorCode.NOT_TEAM_MEMBER, 403)
      }

      const permissions = membership.role.rolePermissions.map(rp => rp.permission.name)

      return {
        role: membership.role,
        permissions,
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`获取用户团队角色失败: ${error.message}`, error.stack)
      throw new HanaException('获取用户团队角色失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }
}
