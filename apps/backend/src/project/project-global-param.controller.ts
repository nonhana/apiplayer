import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { FastifyRequest } from 'fastify'
import { ProjectPermissions } from '@/common/decorators/permissions.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import {
  CreateGlobalParamReqDto,
  CreateGlobalParamsReqDto,
  GetGlobalParamsReqDto,
  GlobalParamDto,
  GlobalParamsDto,
  UpdateGlobalParamReqDto,
} from './dto'
import { ProjectGlobalParamService } from './project-global-param.service'

@Controller('projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectGlobalParamController {
  constructor(
    private readonly projectGlobalParamService: ProjectGlobalParamService,
  ) {}

  /**
   * 创建全局参数
   */
  @Post(':projectId/global-params')
  @ProjectPermissions(['project:write'])
  async createGlobalParam(
    @Param('projectId') projectId: string,
    @Body() createParamDto: CreateGlobalParamReqDto,
    @Req() request: FastifyRequest,
  ): Promise<GlobalParamDto> {
    const user = request.user!
    const newGlobalParam = await this.projectGlobalParamService.createGlobalParam(projectId, createParamDto, user.id)
    return plainToInstance(GlobalParamDto, newGlobalParam)
  }

  /**
   * 批量创建全局参数
   */
  @Post(':projectId/global-params/batch')
  @ProjectPermissions(['project:write'])
  @ResMsg('批量创建全局参数成功')
  async createGlobalParams(
    @Param('projectId') projectId: string,
    @Body() dto: CreateGlobalParamsReqDto,
    @Req() request: FastifyRequest,
  ): Promise<GlobalParamDto[]> {
    const user = request.user!
    const params = await this.projectGlobalParamService.createGlobalParams(projectId, dto, user.id)
    return plainToInstance(GlobalParamDto, params)
  }

  /**
   * 获取全局参数列表
   */
  @Get(':projectId/global-params')
  @ProjectPermissions(['project:read'])
  async getGlobalParams(
    @Param('projectId') projectId: string,
    @Query() dto: GetGlobalParamsReqDto,
    @Req() request: FastifyRequest,
  ): Promise<GlobalParamsDto> {
    const user = request.user!
    const result = await this.projectGlobalParamService.getGlobalParams(projectId, user.id, dto)
    return plainToInstance(GlobalParamsDto, result)
  }

  /**
   * 更新全局参数
   */
  @Patch(':projectId/global-params/:paramId')
  @ProjectPermissions(['project:write'])
  async updateGlobalParam(
    @Param('projectId') projectId: string,
    @Param('paramId') paramId: string,
    @Body() updateParamDto: UpdateGlobalParamReqDto,
    @Req() request: FastifyRequest,
  ): Promise<GlobalParamDto> {
    const user = request.user!
    const result = await this.projectGlobalParamService.updateGlobalParam(projectId, paramId, updateParamDto, user.id)
    return plainToInstance(GlobalParamDto, result)
  }

  /**
   * 删除全局参数
   */
  @Delete(':projectId/global-params/:paramId')
  @ProjectPermissions(['project:write'])
  @ResMsg('全局参数删除成功')
  async deleteGlobalParam(
    @Param('projectId') projectId: string,
    @Param('paramId') paramId: string,
    @Req() request: FastifyRequest,
  ): Promise<void> {
    const user = request.user!
    await this.projectGlobalParamService.deleteGlobalParam(projectId, paramId, user.id)
  }
}
