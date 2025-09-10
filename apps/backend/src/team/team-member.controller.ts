import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { TeamPermissions } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { BasePaginatedQueryDto } from '@/common/dto/pagination.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { InviteMemberReqDto, TeamMemberDto, TeamMembersDto, UpdateMemberReqDto } from './dto'
import { TeamMemberService } from './team-member.service'

@Controller('team-members')
@UseGuards(AuthGuard, PermissionsGuard)
export class TeamMemberController {
  constructor(private readonly teamMemberService: TeamMemberService) {}

  /**
   * 邀请团队成员
   */
  @Post(':teamId/members')
  @TeamPermissions(['team:member:invite'])
  async inviteTeamMember(
    @Param('teamId') teamId: string,
    @Body() inviteDto: InviteMemberReqDto,
    @ReqUser('id') userId: string,
  ): Promise<TeamMemberDto> {
    const newTeamMember = await this.teamMemberService.inviteTeamMember(teamId, inviteDto, userId)
    return plainToInstance(TeamMemberDto, newTeamMember)
  }

  /**
   * 获取团队成员列表
   */
  @Get(':teamId/members')
  @TeamPermissions(['team:read'])
  async getTeamMembers(
    @Param('teamId') teamId: string,
    @Query() query: BasePaginatedQueryDto,
    @ReqUser('id') userId: string,
  ): Promise<TeamMembersDto> {
    const result = await this.teamMemberService.getTeamMembers(teamId, userId, query)
    return plainToInstance(TeamMembersDto, result)
  }

  /**
   * 更新团队成员角色
   */
  @Patch(':teamId/members/:memberId')
  @TeamPermissions(['team:member:manage'])
  async updateTeamMemberRole(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateMemberReqDto,
    @ReqUser('id') userId: string,
  ): Promise<TeamMemberDto> {
    const updatedMember = await this.teamMemberService.updateTeamMemberRole(teamId, memberId, updateDto, userId)
    return plainToInstance(TeamMemberDto, updatedMember)
  }

  /**
   * 移除团队成员
   */
  @Delete(':teamId/members/:memberId')
  @TeamPermissions(['team:member:remove'])
  @ResMsg('团队成员移除成功')
  async removeTeamMember(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.teamMemberService.removeTeamMember(teamId, memberId, userId)
  }
}
