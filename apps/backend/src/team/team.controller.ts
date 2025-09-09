import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { FastifyRequest } from 'fastify'
import { TeamPermissions } from '@/common/decorators/permissions.decorator'
import { TeamMemberDto, TeamMembersDto } from '@/common/dto/member.dto'
import { BasePaginatedQueryDto } from '@/common/dto/pagination.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { CreateTeamDto } from './dto/create-team.dto'
import { DeleteTeamResDto } from './dto/delete-team.dto'
import { InviteMemberDto } from './dto/invite-member.dto'
import { RemoveMemberResDto } from './dto/remove-member.dto'
import { TeamDetailDto, TeamDto } from './dto/team.dto'
import { TeamsDto } from './dto/teams.dto'
import { UpdateMemberDto } from './dto/update-member.dto'
import { UpdateTeamDto } from './dto/update-team.dto'
import { TeamService } from './team.service'

@Controller('teams')
@UseGuards(AuthGuard, PermissionsGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  /**
   * 创建团队
   * 任何登录用户都可以创建团队
   */
  @Post()
  async createTeam(
    @Body() createTeamDto: CreateTeamDto,
    @Req() request: FastifyRequest,
  ): Promise<TeamDto> {
    const user = request.user!
    const newTeam = await this.teamService.createTeam(createTeamDto, user.id)
    return plainToInstance(TeamDto, newTeam)
  }

  /**
   * 获取用户的团队列表
   * 只需要登录即可查看自己的团队
   */
  @Get()
  async getUserTeams(
    @Query() query: BasePaginatedQueryDto,
    @Req() request: FastifyRequest,
  ): Promise<TeamsDto> {
    const user = request.user!
    const result = await this.teamService.getUserTeams(user.id, query)
    return plainToInstance(TeamsDto, result)
  }

  /**
   * 获取团队详情
   * 需要是团队成员才能查看详情
   */
  @Get(':teamId')
  @TeamPermissions(['team:read'])
  async getTeamDetail(
    @Param('teamId') teamId: string,
    @Req() request: FastifyRequest,
  ): Promise<TeamDetailDto> {
    const user = request.user!
    const teamDetail = await this.teamService.getTeamDetail(teamId, user.id)
    return plainToInstance(TeamDetailDto, teamDetail)
  }

  /**
   * 更新团队信息
   * 需要团队写入权限
   */
  @Patch(':teamId')
  @TeamPermissions(['team:write'])
  async updateTeam(
    @Param('teamId') teamId: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @Req() request: FastifyRequest,
  ): Promise<TeamDto> {
    const user = request.user!
    const updatedTeam = await this.teamService.updateTeam(teamId, updateTeamDto, user.id)
    return plainToInstance(TeamDto, updatedTeam)
  }

  /**
   * 删除团队
   * 需要团队管理权限
   */
  @Delete(':teamId')
  @TeamPermissions(['team:admin'])
  async deleteTeam(
    @Param('teamId') teamId: string,
    @Req() request: FastifyRequest,
  ): Promise<DeleteTeamResDto> {
    const user = request.user!
    return await this.teamService.deleteTeam(teamId, user.id)
  }

  // ==================== 团队成员管理 ====================

  /**
   * 邀请团队成员
   * 需要成员邀请权限
   */
  @Post(':teamId/members')
  @TeamPermissions(['team:member:invite'])
  async inviteTeamMember(
    @Param('teamId') teamId: string,
    @Body() inviteDto: InviteMemberDto,
    @Req() request: FastifyRequest,
  ): Promise<TeamMemberDto> {
    const user = request.user!
    const newTeamMember = await this.teamService.inviteTeamMember(teamId, inviteDto, user.id)
    return plainToInstance(TeamMemberDto, newTeamMember)
  }

  /**
   * 获取团队成员列表
   * 需要团队读取权限
   */
  @Get(':teamId/members')
  @TeamPermissions(['team:read'])
  async getTeamMembers(
    @Param('teamId') teamId: string,
    @Query() query: BasePaginatedQueryDto,
    @Req() request: FastifyRequest,
  ): Promise<TeamMembersDto> {
    const user = request.user!
    const result = await this.teamService.getTeamMembers(teamId, user.id, query)
    return plainToInstance(TeamMembersDto, result)
  }

  /**
   * 更新团队成员角色
   * 需要成员管理权限
   */
  @Patch(':teamId/members/:memberId')
  @TeamPermissions(['team:member:manage'])
  async updateTeamMemberRole(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateMemberDto,
    @Req() request: FastifyRequest,
  ): Promise<TeamMemberDto> {
    const user = request.user!
    const updatedMember = await this.teamService.updateTeamMemberRole(teamId, memberId, updateDto, user.id)
    return plainToInstance(TeamMemberDto, updatedMember)
  }

  /**
   * 移除团队成员
   * 需要成员移除权限
   */
  @Delete(':teamId/members/:memberId')
  @TeamPermissions(['team:member:remove'])
  async removeTeamMember(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Req() request: FastifyRequest,
  ): Promise<RemoveMemberResDto> {
    const user = request.user!
    return await this.teamService.removeTeamMember(teamId, memberId, user.id)
  }
}
