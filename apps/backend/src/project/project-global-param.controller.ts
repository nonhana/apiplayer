import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ProjectPermissions } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
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
    @ReqUser('id') userId: string,
  ): Promise<GlobalParamDto> {
    const newGlobalParam = await this.projectGlobalParamService.createGlobalParam(projectId, createParamDto, userId)
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
    @ReqUser('id') userId: string,
  ): Promise<GlobalParamDto[]> {
    const params = await this.projectGlobalParamService.createGlobalParams(projectId, dto, userId)
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
    @ReqUser('id') userId: string,
  ): Promise<GlobalParamsDto> {
    const result = await this.projectGlobalParamService.getGlobalParams(projectId, userId, dto)
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
    @ReqUser('id') userId: string,
  ): Promise<GlobalParamDto> {
    const result = await this.projectGlobalParamService.updateGlobalParam(projectId, paramId, updateParamDto, userId)
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
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.projectGlobalParamService.deleteGlobalParam(projectId, paramId, userId)
  }
}
