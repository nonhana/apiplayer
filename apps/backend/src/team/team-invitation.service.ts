import { randomUUID } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InvitationStatus } from 'prisma/generated/enums'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { SystemConfigService } from '@/infra/system-config/system-config.service'
import { RoleService } from '@/role/role.service'
import { UtilService } from '@/util/util.service'
import { SendInvitationDto } from './dto'
import { TeamUtilsService } from './utils.service'

const DEFAULT_FRONTEND_URL = 'http://localhost:5173'

@Injectable()
export class TeamInvitationService {
  private readonly logger = new Logger(TeamInvitationService.name)
  private readonly frontendUrl: string

  constructor(
    private readonly prisma: PrismaService,
    private readonly teamUtilsService: TeamUtilsService,
    private readonly roleService: RoleService,
    private readonly utilService: UtilService,
    private readonly configService: ConfigService,
    private readonly systemConfigService: SystemConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? DEFAULT_FRONTEND_URL
  }

  /** 发送团队邀请 */
  async sendInvitation(dto: SendInvitationDto, teamId: string, inviterId: string) {
    const { email, roleId, nickname } = dto

    try {
      const team = await this.teamUtilsService.getTeamById(teamId)

      // 验证角色是否存在
      const role = await this.roleService.getRole('id', roleId)

      // 检查该邮箱是否已经是团队成员
      const existingMember = await this.prisma.teamMember.findFirst({
        where: {
          teamId,
          user: { email },
        },
      })

      if (existingMember) {
        throw new HanaException('USER_ALREADY_TEAM_MEMBER')
      }

      // 检查是否有待处理的邀请
      const existingInvitation = await this.prisma.teamInvitation.findFirst({
        where: {
          teamId,
          email,
          status: InvitationStatus.PENDING,
        },
      })

      if (existingInvitation) {
        throw new HanaException('INVITATION_ALREADY_PENDING')
      }

      // 生成邀请 token
      const token = randomUUID()

      // 从系统配置读取过期天数
      const invitationExpiresDays = this.systemConfigService.get<number>('invitation.expires_days')

      // 计算过期时间
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + invitationExpiresDays)

      // 创建邀请记录
      const invitation = await this.prisma.teamInvitation.create({
        data: {
          teamId,
          email,
          roleId,
          nickname,
          token,
          inviterId,
          expiresAt,
        },
        include: {
          inviter: true,
          role: true,
          team: true,
        },
      })

      // 获取邀请人信息
      const inviter = await this.prisma.user.findUnique({
        where: { id: inviterId },
      })

      // 发送邀请邮件
      const inviteLink = `${this.frontendUrl}/invite/accept?token=${token}`

      await this.utilService.sendMail({
        to: email,
        subject: `您被邀请加入团队「${team.name}」`,
        html: this.buildInvitationEmailHtml({
          inviterName: inviter?.name ?? '某位用户',
          teamName: team.name,
          roleName: role.description ?? role.name,
          inviteLink,
          expiresDays: invitationExpiresDays,
        }),
      })

      this.logger.log(
        `用户 ${inviterId} 向 ${email} 发送了加入团队 ${teamId} 的邀请`,
      )

      return invitation
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error(`发送团队邀请失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 获取团队邀请列表 */
  async getTeamInvitations(teamId: string) {
    try {
      await this.teamUtilsService.getTeamById(teamId)

      const invitations = await this.prisma.teamInvitation.findMany({
        where: { teamId },
        include: {
          inviter: true,
          role: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      return invitations
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error(`获取团队邀请列表失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 撤销邀请 */
  async cancelInvitation(teamId: string, invitationId: string, operatorId: string) {
    try {
      await this.teamUtilsService.getTeamById(teamId)

      const invitation = await this.prisma.teamInvitation.findUnique({
        where: { id: invitationId },
      })

      if (!invitation || invitation.teamId !== teamId) {
        throw new HanaException('INVITATION_NOT_FOUND')
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        throw new HanaException('INVALID_PARAMS')
      }

      await this.prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.CANCELLED },
      })

      this.logger.log(
        `用户 ${operatorId} 撤销了团队 ${teamId} 对 ${invitation.email} 的邀请`,
      )

      return { success: true }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error(`撤销邀请失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 验证邀请 token */
  async verifyInvitation(token: string) {
    try {
      const invitation = await this.prisma.teamInvitation.findUnique({
        where: { token },
        include: {
          team: true,
          role: true,
          inviter: true,
        },
      })

      if (!invitation) {
        throw new HanaException('INVITATION_NOT_FOUND')
      }

      if (invitation.status === InvitationStatus.ACCEPTED) {
        throw new HanaException('INVITATION_ALREADY_ACCEPTED')
      }

      if (invitation.status === InvitationStatus.CANCELLED) {
        throw new HanaException('INVITATION_CANCELLED')
      }

      if (invitation.expiresAt < new Date() || invitation.status === InvitationStatus.EXPIRED) {
        // 如果已过期但状态未更新，则更新状态
        if (invitation.status === InvitationStatus.PENDING) {
          await this.prisma.teamInvitation.update({
            where: { id: invitation.id },
            data: { status: InvitationStatus.EXPIRED },
          })
        }
        throw new HanaException('INVITATION_EXPIRED')
      }

      // 检查邮箱是否已注册
      const existingUser = await this.prisma.user.findUnique({
        where: { email: invitation.email },
      })

      return {
        valid: true,
        emailRegistered: !!existingUser,
        invitation,
      }
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error(`验证邀请失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 接受邀请 */
  async acceptInvitation(token: string, userId: string) {
    try {
      const invitation = await this.prisma.teamInvitation.findUnique({
        where: { token },
        include: {
          team: true,
          role: true,
        },
      })

      if (!invitation) {
        throw new HanaException('INVITATION_NOT_FOUND')
      }

      if (invitation.status === InvitationStatus.ACCEPTED) {
        throw new HanaException('INVITATION_ALREADY_ACCEPTED')
      }

      if (invitation.status === InvitationStatus.CANCELLED) {
        throw new HanaException('INVITATION_CANCELLED')
      }

      if (invitation.expiresAt < new Date()) {
        // 更新状态为已过期
        await this.prisma.teamInvitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.EXPIRED },
        })
        throw new HanaException('INVITATION_EXPIRED')
      }

      // 获取当前用户信息
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new HanaException('USER_NOT_FOUND')
      }

      // 验证邮箱是否匹配
      if (user.email !== invitation.email) {
        throw new HanaException('INVITATION_EMAIL_MISMATCH')
      }

      // 检查用户是否已经是团队成员
      const existingMember = await this.prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId: invitation.teamId,
          },
        },
      })

      if (existingMember) {
        // 已是成员，将邀请标记为已接受
        await this.prisma.teamInvitation.update({
          where: { id: invitation.id },
          data: {
            status: InvitationStatus.ACCEPTED,
            acceptedAt: new Date(),
          },
        })
        throw new HanaException('USER_ALREADY_TEAM_MEMBER')
      }

      // 在事务中创建成员并更新邀请状态
      await this.prisma.$transaction(async (tx) => {
        // 创建团队成员
        await tx.teamMember.create({
          data: {
            userId,
            teamId: invitation.teamId,
            roleId: invitation.roleId,
            nickname: invitation.nickname,
          },
        })

        // 更新邀请状态
        await tx.teamInvitation.update({
          where: { id: invitation.id },
          data: {
            status: InvitationStatus.ACCEPTED,
            acceptedAt: new Date(),
          },
        })
      })

      this.logger.log(
        `用户 ${userId} 接受了加入团队 ${invitation.teamId} 的邀请`,
      )

      return invitation
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      this.logger.error(`接受邀请失败: ${error.message}`, error.stack)
      throw new HanaException('INTERNAL_SERVER_ERROR')
    }
  }

  /** 构建邀请邮件 HTML */
  private buildInvitationEmailHtml(params: {
    inviterName: string
    teamName: string
    roleName: string
    inviteLink: string
    expiresDays: number
  }) {
    const { inviterName, teamName, roleName, inviteLink, expiresDays } = params

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>团队邀请</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1a1a1a; text-align: center;">
                您被邀请加入团队
              </h1>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #333333;">
                <strong>${inviterName}</strong> 邀请您加入团队
                <strong style="color: #0092d0;">「${teamName}」</strong>
              </p>

              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #333333;">
                您将以 <strong style="color: #059669;">${roleName}</strong> 角色加入团队。
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}"
                       style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 500; color: #ffffff; background-color: #0092d0; border-radius: 8px; text-decoration: none; transition: background-color 0.2s;">
                      接受邀请
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 8px; font-size: 14px; color: #666666; text-align: center;">
                此邀请链接将在 ${expiresDays} 天后过期。
              </p>
              <p style="margin: 0; font-size: 14px; color: #666666; text-align: center;">
                如果您不认识邀请人，请忽略此邮件。
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #eaeaea; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
                此邮件由 ApiPlayer 自动发送，请勿回复。
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()
  }
}
