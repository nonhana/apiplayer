import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { RequireTeamMember, TeamPermissions } from '@/common/decorators/permissions.decorator'
import { Public } from '@/common/decorators/public.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { AcceptInvitationResultDto, InvitationDto, SendInvitationDto, VerifyInvitationDto } from './dto'
import { TeamInvitationService } from './team-invitation.service'

@Controller('team-invitations')
@UseGuards(AuthGuard, PermissionsGuard)
export class TeamInvitationController {
  constructor(private readonly teamInvitationService: TeamInvitationService) {}

  /** 发送团队邀请 */
  @Post(':teamId/invitations')
  @RequireTeamMember()
  @TeamPermissions(['team:member:invite'])
  async sendInvitation(
    @Param('teamId') teamId: string,
    @Body() dto: SendInvitationDto,
    @ReqUser('id') userId: string,
  ): Promise<InvitationDto> {
    const invitation = await this.teamInvitationService.sendInvitation(dto, teamId, userId)
    return plainToInstance(InvitationDto, invitation)
  }

  /** 获取团队邀请列表 */
  @Get(':teamId/invitations')
  @RequireTeamMember()
  @TeamPermissions(['team:read'])
  async getTeamInvitations(
    @Param('teamId') teamId: string,
  ): Promise<InvitationDto[]> {
    const invitations = await this.teamInvitationService.getTeamInvitations(teamId)
    return plainToInstance(InvitationDto, invitations)
  }

  /** 撤销邀请 */
  @Delete(':teamId/invitations/:invitationId')
  @RequireTeamMember()
  @TeamPermissions(['team:member:invite'])
  @ResMsg('邀请已撤销')
  async cancelInvitation(
    @Param('teamId') teamId: string,
    @Param('invitationId') invitationId: string,
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.teamInvitationService.cancelInvitation(teamId, invitationId, userId)
  }

  /** 验证邀请 token */
  @Public()
  @Get('verify')
  async verifyInvitation(
    @Query('token') token: string,
  ): Promise<VerifyInvitationDto> {
    return await this.teamInvitationService.verifyInvitation(token)
  }

  /** 接受邀请 */
  @Post('accept')
  async acceptInvitation(
    @Body('token') token: string,
    @ReqUser('id') userId: string,
  ): Promise<AcceptInvitationResultDto> {
    const result = await this.teamInvitationService.acceptInvitation(token, userId)
    return plainToInstance(AcceptInvitationResultDto, result)
  }
}
