import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { FastifyRequest } from 'fastify'
import { TeamPermissions } from '@/common/decorators/permissions.decorator'
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
    @Req() request: FastifyRequest,
  ): Promise<TeamMemberDto> {
    const user = request.user!
    const newTeamMember = await this.teamMemberService.inviteTeamMember(teamId, inviteDto, user.id)
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
    @Req() request: FastifyRequest,
  ): Promise<TeamMembersDto> {
    const user = request.user!
    const result = await this.teamMemberService.getTeamMembers(teamId, user.id, query)
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
    @Req() request: FastifyRequest,
  ): Promise<TeamMemberDto> {
    const user = request.user!
    const updatedMember = await this.teamMemberService.updateTeamMemberRole(teamId, memberId, updateDto, user.id)
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
    @Req() request: FastifyRequest,
  ): Promise<void> {
    const user = request.user!
    await this.teamMemberService.removeTeamMember(teamId, memberId, user.id)
  }
}
