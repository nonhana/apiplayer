import { Injectable, Logger } from '@nestjs/common'
import { ProjectMemberWhereInput } from 'prisma/generated/models'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { RoleService } from '@/role/role.service'
import { UserService } from '@/user/user.service'
import { GetMembersReqDto, InviteMembersReqDto, UpdateMemberReqDto } from './dto'
import { ProjectUtilsService } from './utils.service'

@Injectable()
export class ProjectMemberService {
  private readonly logger = new Logger(ProjectMemberService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectUtilsService: ProjectUtilsService,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  async inviteProjectMembers(dto: InviteMembersReqDto, projectId: string, inviterId: string) {
    const { members } = dto

    try {
      const project = await this.projectUtilsService.getProjectById(projectId)

      // 批量获取所有要邀请的用户
      const users = await Promise.all(
        members.map(m => this.userService.getUserByEmail(m.email)),
      )
      const userMap = new Map(users.map(user => [user.email, user]))

      // 批量验证角色是否存在（去重后验证，避免重复查询）
      const uniqueRoleIds = [...new Set(members.map(m => m.roleId))]
      await Promise.all(
        uniqueRoleIds.map(roleId => this.roleService.getRole('id', roleId)),
      )

      const newMembers = await this.prisma.$transaction(async (tx) => {
        // 先进行所有验证
        for (const member of members) {
          const user = userMap.get(member.email)!

          // 检查用户是否已经是项目成员
          const existingMember = await tx.projectMember.findUnique({
            where: {
              userId_projectId: {
                userId: user.id,
                projectId,
              },
            },
          })

          if (existingMember) {
            throw new HanaException(
              `用户 ${user.email} 已经是项目成员`,
              ErrorCode.USER_ALREADY_PROJECT_MEMBER,
            )
          }

          // 检查用户是否是团队成员
          const teamMember = await tx.teamMember.findUnique({
            where: {
              userId_teamId: {
                userId: user.id,
                teamId: project.teamId,
              },
            },
          })

          if (!teamMember) {
            throw new HanaException(
              `用户 ${user.email} 不是团队成员，只能邀请团队成员加入项目`,
              ErrorCode.USER_NOT_TEAM_MEMBER,
            )
          }
        }

        // 验证通过后，批量创建所有成员
        return Promise.all(
          members.map((member) => {
            const user = userMap.get(member.email)!
            return tx.projectMember.create({
              data: {
                userId: user.id,
                projectId,
                roleId: member.roleId,
              },
              include: {
                user: true,
                role: true,
              },
            })
          }),
        )
      })

      this.logger.log(
        `用户 ${inviterId} 邀请了 ${newMembers.length} 名用户加入项目 ${projectId}`,
      )

      return newMembers
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error(`邀请项目成员失败: ${error.message}`, error.stack)
      throw new HanaException('邀请项目成员失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  /** 获取项目全部成员（不分页） */
  async getAllProjectMembers(projectId: string) {
    try {
      await this.projectUtilsService.getProjectById(projectId)

      const members = await this.prisma.projectMember.findMany({
        where: { projectId },
        include: {
          user: true,
          role: true,
        },
        orderBy: { joinedAt: 'asc' },
      })

      return members
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error(`获取项目全部成员失败: ${error.message}`, error.stack)
      throw new HanaException('获取项目全部成员失败', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }
  }

  async getProjectMembers(dto: GetMembersReqDto, projectId: string) {
    const { page = 1, limit = 10, search } = dto

    try {
      // 检查项目是否存在和用户权限
      await this.projectUtilsService.getProjectById(projectId)

      const skip = (page - 1) * limit

      // 构建搜索条件
      const searchCondition: ProjectMemberWhereInput = search
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
            user: true,
            role: true,
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

  async updateProjectMember(dto: UpdateMemberReqDto, projectId: string, memberId: string, operatorId: string) {
    const { roleId } = dto

    try {
      await this.projectUtilsService.getProjectById(projectId)

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

      await this.roleService.getRole('id', roleId)

      // 更新成员角色
      const updatedMember = await this.prisma.projectMember.update({
        where: { id: memberId },
        data: { roleId },
        include: {
          user: true,
          role: true,
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
      await this.projectUtilsService.getProjectById(projectId)

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
