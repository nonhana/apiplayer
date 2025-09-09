import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { GetMembersReqDto, InviteMemberReqDto, UpdateMemberReqDto } from './dto'
import { ProjectUtilsService } from './utils.service'

@Injectable()
export class ProjectMemberService {
  private readonly logger = new Logger(ProjectMemberService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectUtilsService: ProjectUtilsService,
  ) {}

  async inviteProjectMember(projectId: string, inviteDto: InviteMemberReqDto, inviterId: string) {
    const { email, roleId } = inviteDto

    try {
      // 检查项目是否存在
      const project = await this.projectUtilsService.getProjectById(projectId)

      // 验证邀请者权限
      await this.projectUtilsService.checkUserProjectMembership(projectId, inviterId)

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
      const newMember = await this.prisma.projectMember.create({
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

      return newMember
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`邀请项目成员失败: ${error.message}`, error.stack)
      throw new HanaException('邀请项目成员失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async getProjectMembers(projectId: string, userId: string, query: GetMembersReqDto) {
    const { page = 1, limit = 10, search } = query

    try {
      // 检查项目是否存在和用户权限
      await this.projectUtilsService.getProjectById(projectId)
      await this.projectUtilsService.checkUserProjectMembership(projectId, userId)

      const skip = (page - 1) * limit

      // 构建搜索条件
      const searchCondition: Prisma.ProjectMemberWhereInput = search
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

      this.logger.error(`获取项目成员列表失败: ${error.message}`, error.stack)
      throw new HanaException('获取项目成员列表失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async updateProjectMember(projectId: string, memberId: string, updateDto: UpdateMemberReqDto, operatorId: string) {
    const { roleId } = updateDto

    try {
      // 检查项目是否存在
      await this.projectUtilsService.getProjectById(projectId)

      // 验证操作者权限
      await this.projectUtilsService.checkUserProjectMembership(projectId, operatorId)

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

      return updatedMember
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }

      this.logger.error(`更新项目成员角色失败: ${error.message}`, error.stack)
      throw new HanaException('更新项目成员角色失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async removeProjectMember(projectId: string, memberId: string, operatorId: string) {
    try {
      // 检查项目是否存在
      await this.projectUtilsService.getProjectById(projectId)

      // 验证操作者权限
      await this.projectUtilsService.checkUserProjectMembership(projectId, operatorId)

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
}
