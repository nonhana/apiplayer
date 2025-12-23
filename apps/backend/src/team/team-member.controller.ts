import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { RequireTeamMember, TeamPermissions } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { BasePaginatedQueryDto } from '@/common/dto/pagination.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { InviteMembersReqDto, TeamMemberDto, TeamMembersDto, UpdateMemberReqDto } from './dto'
import { TeamMemberService } from './team-member.service'

@Controller('team-members')
@UseGuards(AuthGuard, PermissionsGuard)
export class TeamMemberController {
  constructor(private readonly teamMemberService: TeamMemberService) {}

  /** 邀请别人加入团队 */
  @Post(':teamId/members')
  @RequireTeamMember()
  @TeamPermissions(['team:member:invite'])
  async inviteTeamMembers(
    @Param('teamId') teamId: string,
    @Body() dto: InviteMembersReqDto,
    @ReqUser('id') userId: string,
  ): Promise<TeamMemberDto[]> {
    const newTeamMember = await this.teamMemberService.inviteTeamMembers(dto, teamId, userId)
    return plainToInstance(TeamMemberDto, newTeamMember)
  }

  /** 分页获取团队成员列表 */
  @Get(':teamId/members')
  @RequireTeamMember()
  @TeamPermissions(['team:read'])
  async getTeamMembers(
    @Param('teamId') teamId: string,
    @Query() dto: BasePaginatedQueryDto,
  ): Promise<TeamMembersDto> {
    const result = await this.teamMemberService.getTeamMembers(dto, teamId)
    return plainToInstance(TeamMembersDto, result)
  }

  /** 获取全部团队成员列表 */
  @Get(':teamId/members/all')
  @RequireTeamMember()
  @TeamPermissions(['team:read'])
  async getAllTeamMembers(
    @Param('teamId') teamId: string,
  ): Promise<TeamMemberDto[]> {
    const result = await this.teamMemberService.getAllTeamMembers(teamId)
    return plainToInstance(TeamMemberDto, result)
  }

  /** 更新团队成员角色 */
  @Patch(':teamId/members/:memberId')
  @RequireTeamMember()
  @TeamPermissions(['team:member:manage'])
  async updateTeamMemberRole(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberReqDto,
    @ReqUser('id') userId: string,
  ): Promise<TeamMemberDto> {
    const updatedMember = await this.teamMemberService.updateTeamMemberRole(dto, teamId, memberId, userId)
    return plainToInstance(TeamMemberDto, updatedMember)
  }

  /** 移除团队成员 */
  @Delete(':teamId/members/:memberId')
  @RequireTeamMember()
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
