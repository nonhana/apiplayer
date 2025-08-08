import { Injectable, Logger } from '@nestjs/common'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { nullToUndefined } from '@/utils'
import {
  InviteProjectMemberDto,
  InviteProjectMemberResponseDto,
  ProjectListQueryDto,
  ProjectMemberInfoDto,
  ProjectMembersResponseDto,
  RemoveProjectMemberResponseDto,
  UpdateProjectMemberResponseDto,
  UpdateProjectMemberRoleDto,
} from './dto'

@Injectable()
export class ProjectMemberService {
  private readonly logger = new Logger(ProjectMemberService.name)

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 邀请项目成员
   * @param projectId 项目 ID
   * @param inviteDto 邀请信息
   * @param inviterId 邀请者 ID
   */
  async inviteProjectMember(projectId: string, inviteDto: InviteProjectMemberDto, inviterId: string): Promise<InviteProjectMemberResponseDto> {
    const { email, roleId } = inviteDto

    try {
      // 检查项目是否存在
      const project = await this.getProjectById(projectId)

      // 验证邀请者权限
      await this.checkUserProjectMembership(projectId, inviterId)

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

      // 检查用户是否已经是项目成员
      const existingMember = await this.prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: invitedUser.id,
            projectId,
          },
        },
      })

      if (existingMember) {
        throw new HanaException('用户已经是项目成员', ErrorCode.USER_ALREADY_PROJECT_MEMBER)
      }

      // 检查用户是否是团队成员
      const teamMember = await this.prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: invitedUser.id,
            teamId: project.teamId,
          },
        },
      })

      if (!teamMember) {
        throw new HanaException('只能邀请团队成员加入项目', ErrorCode.USER_NOT_TEAM_MEMBER)
      }

      // 验证角色是否存在
      const role = await this.prisma.role.findUnique({
        where: { id: roleId },
      })

      if (!role) {
        throw new HanaException('指定的角色不存在', ErrorCode.ROLE_NOT_FOUND, 404)
      }

      // 创建项目成员关系
      const projectMember = await this.prisma.projectMember.create({
        data: {
          userId: invitedUser.id,
          projectId,
          roleId,
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

      this.logger.log(`用户 ${inviterId} 邀请了用户 ${invitedUser.username} 加入项目 ${projectId}`)

      return {
        message: '成员邀请成功',
        member: {
          id: projectMember.id,
          user: {
            ...projectMember.user,
            avatar: nullToUndefined(projectMember.user.avatar),
          },
          role: {
            ...projectMember.role,
            description: nullToUndefined(projectMember.role.description),
          },
          joinedAt: projectMember.joinedAt,
        },
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`邀请项目成员失败: ${error.message}`, error.stack)
      throw new HanaException('邀请项目成员失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /**
   * 获取项目成员列表
   * @param projectId 项目 ID
   * @param userId 当前用户 ID
   * @param query 查询参数
   */
  async getProjectMembers(projectId: string, userId: string, query: ProjectListQueryDto): Promise<ProjectMembersResponseDto> {
    const { page = 1, limit = 10, search } = query

    try {
      // 检查项目是否存在和用户权限
      await this.getProjectById(projectId)
      await this.checkUserProjectMembership(projectId, userId)

      const skip = (page - 1) * limit

      // 构建搜索条件
      const searchCondition = search
        ? {
            OR: [
              { user: { username: { contains: search, mode: 'insensitive' as const } } },
              { user: { name: { contains: search, mode: 'insensitive' as const } } },
              { user: { email: { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}

      // 查询成员列表和总数
      const [members, total] = await Promise.all([
        this.prisma.projectMember.findMany({
          where: {
            projectId,
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
        this.prisma.projectMember.count({
          where: {
            projectId,
            ...searchCondition,
          },
        }),
      ])

      const memberList: ProjectMemberInfoDto[] = members.map(member => ({
        id: member.id,
        user: {
          ...member.user,
          avatar: nullToUndefined(member.user.avatar),
        },
        role: {
          ...member.role,
          description: nullToUndefined(member.role.description),
        },
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

      this.logger.error(`获取项目成员列表失败: ${error.message}`, error.stack)
      throw new HanaException('获取项目成员列表失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /**
   * 更新项目成员角色
   * @param projectId 项目 ID
   * @param memberId 成员 ID
   * @param updateDto 更新数据
   * @param operatorId 操作者 ID
   */
  async updateProjectMemberRole(projectId: string, memberId: string, updateDto: UpdateProjectMemberRoleDto, operatorId: string): Promise<UpdateProjectMemberResponseDto> {
    const { roleId } = updateDto

    try {
      // 检查项目是否存在
      await this.getProjectById(projectId)

      // 验证操作者权限
      await this.checkUserProjectMembership(projectId, operatorId)

      // 查找要更新的成员
      const member = await this.prisma.projectMember.findUnique({
        where: { id: memberId },
        include: {
          user: true,
          role: true,
        },
      })

      if (!member || member.projectId !== projectId) {
        throw new HanaException('项目成员不存在', ErrorCode.PROJECT_MEMBER_NOT_FOUND, 404)
      }

      // 验证新角色是否存在
      const newRole = await this.prisma.role.findUnique({
        where: { id: roleId },
      })

      if (!newRole) {
        throw new HanaException('指定的角色不存在', ErrorCode.ROLE_NOT_FOUND, 404)
      }

      // 更新成员角色
      const updatedMember = await this.prisma.projectMember.update({
        where: { id: memberId },
        data: { roleId },
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

      this.logger.log(`用户 ${operatorId} 更新了项目 ${projectId} 中成员 ${member.user.username} 的角色`)

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
          joinedAt: updatedMember.joinedAt,
        },
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`更新项目成员角色失败: ${error.message}`, error.stack)
      throw new HanaException('更新项目成员角色失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /**
   * 移除项目成员
   * @param projectId 项目 ID
   * @param memberId 成员 ID
   * @param operatorId 操作者 ID
   */
  async removeProjectMember(projectId: string, memberId: string, operatorId: string): Promise<RemoveProjectMemberResponseDto> {
    try {
      // 检查项目是否存在
      await this.getProjectById(projectId)

      // 验证操作者权限
      await this.checkUserProjectMembership(projectId, operatorId)

      // 查找要移除的成员
      const member = await this.prisma.projectMember.findUnique({
        where: { id: memberId },
        include: {
          user: true,
          role: true,
        },
      })

      if (!member || member.projectId !== projectId) {
        throw new HanaException('项目成员不存在', ErrorCode.PROJECT_MEMBER_NOT_FOUND, 404)
      }

      // 检查是否尝试移除项目管理员（如果是最后一个管理员）
      if (member.role.name === 'project:admin') {
        const adminCount = await this.prisma.projectMember.count({
          where: {
            projectId,
            role: { name: 'project:admin' },
          },
        })

        if (adminCount === 1) {
          throw new HanaException('不能移除项目的最后一个管理员', ErrorCode.CANNOT_REMOVE_LAST_ADMIN)
        }
      }

      // 移除成员
      await this.prisma.projectMember.delete({
        where: { id: memberId },
      })

      this.logger.log(`用户 ${operatorId} 从项目 ${projectId} 中移除了成员 ${member.user.username}`)

      return {
        message: '成员移除成功',
        removedMemberId: memberId,
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`移除项目成员失败: ${error.message}`, error.stack)
      throw new HanaException('移除项目成员失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 根据 ID 获取项目信息
   * @param projectId 项目 ID
   */
  private async getProjectById(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new HanaException('项目不存在', ErrorCode.PROJECT_NOT_FOUND, 404)
    }

    if (project.status !== 'ACTIVE') {
      throw new HanaException('项目已被删除', ErrorCode.PROJECT_DELETED)
    }

    return project
  }

  /**
   * 检查用户是否为项目成员
   * @param projectId 项目 ID
   * @param userId 用户 ID
   */
  private async checkUserProjectMembership(projectId: string, userId: string): Promise<void> {
    const membership = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    })

    if (!membership) {
      throw new HanaException('您不是该项目的成员', ErrorCode.NOT_PROJECT_MEMBER, 403)
    }
  }
}
