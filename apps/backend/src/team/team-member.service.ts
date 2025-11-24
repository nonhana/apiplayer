import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { BasePaginatedQueryDto } from '@/common/dto/pagination.dto'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { RoleService } from '@/role/role.service'
import { UserService } from '@/user/user.service'
import { InviteMemberReqDto, UpdateMemberReqDto } from './dto'
import { TeamUtilsService } from './utils.service'

@Injectable()
export class TeamMemberService {
  private readonly logger = new Logger(TeamMemberService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly teamUtilsService: TeamUtilsService,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  async inviteTeamMember(dto: InviteMemberReqDto, teamId: string, inviterId: string) {
    const { email, roleId, nickname } = dto

    try {
      await this.teamUtilsService.getTeamById(teamId)

      const targetUser = await this.userService.getUserByEmail(email)

      const existingMember = await this.prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: targetUser.id,
            teamId,
          },
        },
      })

      if (existingMember) {
        throw new HanaException('用户已经是团队成员', ErrorCode.USER_ALREADY_TEAM_MEMBER)
      }

      await this.roleService.getRole('id', roleId)

      // 创建团队成员关系
      const newTeamMember = await this.prisma.teamMember.create({
        data: {
          userId: targetUser.id,
          teamId,
          roleId,
          nickname,
        },
        include: {
          user: true,
          role: true,
        },
      })

      this.logger.log(`用户 ${inviterId} 邀请了用户 ${targetUser.username} 加入团队 ${teamId}`)

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

  async getTeamMembers(dto: BasePaginatedQueryDto, teamId: string) {
    const { page = 1, limit = 10, search } = dto

    try {
      await this.teamUtilsService.getTeamById(teamId)

      const skip = (page - 1) * limit

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

      const [members, total] = await Promise.all([
        this.prisma.teamMember.findMany({
          where: {
            teamId,
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

  async updateTeamMemberRole(dto: UpdateMemberReqDto, teamId: string, memberId: string, operatorId: string) {
    const { roleId, nickname } = dto

    try {
      await this.teamUtilsService.getTeamById(teamId)

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

      await this.roleService.getRole('id', roleId)

      // 更新成员角色
      const updatedMember = await this.prisma.teamMember.update({
        where: { id: memberId },
        data: {
          roleId,
          ...(nickname !== undefined && { nickname }),
        },
        include: {
          user: true,
          role: true,
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
      await this.teamUtilsService.getTeamById(teamId)

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
}
