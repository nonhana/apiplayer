import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { FastifyRequest } from 'fastify'
import { TeamPermissions } from '@/common/decorators/permissions.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { BasePaginatedQueryDto } from '@/common/dto/pagination.dto'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { CreateTeamReqDto, TeamDetailDto, TeamDto, TeamsDto, UpdateTeamReqDto } from './dto'
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
    @Body() createTeamDto: CreateTeamReqDto,
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
  ) {
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
    @Body() updateTeamDto: UpdateTeamReqDto,
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
  @ResMsg('团队删除成功')
  async deleteTeam(
    @Param('teamId') teamId: string,
    @Req() request: FastifyRequest,
  ): Promise<void> {
    const user = request.user!
    await this.teamService.deleteTeam(teamId, user.id)
  }
}
