import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ProjectPermissions, RequireProjectMember } from '@/common/decorators/permissions.decorator'
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

  /** 创建项目全局参数 */
  @Post(':projectId/global-params')
  @RequireProjectMember()
  @ProjectPermissions(['project:write'])
  async createGlobalParam(
    @Param('projectId') projectId: string,
    @Body() dto: CreateGlobalParamReqDto,
    @ReqUser('id') userId: string,
  ): Promise<GlobalParamDto> {
    const result = await this.projectGlobalParamService.createGlobalParam(dto, projectId, userId)
    return plainToInstance(GlobalParamDto, result)
  }

  /** 批量创建项目全局参数 */
  @Post(':projectId/global-params/batch')
  @RequireProjectMember()
  @ProjectPermissions(['project:write'])
  @ResMsg('批量创建全局参数成功')
  async createGlobalParams(
    @Param('projectId') projectId: string,
    @Body() dto: CreateGlobalParamsReqDto,
    @ReqUser('id') userId: string,
  ): Promise<GlobalParamDto[]> {
    const result = await this.projectGlobalParamService.createGlobalParams(dto, projectId, userId)
    return plainToInstance(GlobalParamDto, result)
  }

  /** 获取项目全局参数列表 */
  @Get(':projectId/global-params')
  @RequireProjectMember()
  @ProjectPermissions(['project:read'])
  async getGlobalParams(
    @Param('projectId') projectId: string,
    @Query() dto: GetGlobalParamsReqDto,
  ): Promise<GlobalParamsDto> {
    const result = await this.projectGlobalParamService.getGlobalParams(dto, projectId)
    return plainToInstance(GlobalParamsDto, result)
  }

  /** 更新全局参数 */
  @Patch(':projectId/global-params/:paramId')
  @RequireProjectMember()
  @ProjectPermissions(['project:write'])
  async updateGlobalParam(
    @Param('projectId') projectId: string,
    @Param('paramId') paramId: string,
    @Body() dto: UpdateGlobalParamReqDto,
    @ReqUser('id') userId: string,
  ): Promise<GlobalParamDto> {
    const result = await this.projectGlobalParamService.updateGlobalParam(dto, projectId, paramId, userId)
    return plainToInstance(GlobalParamDto, result)
  }

  /** 删除全局参数 */
  @Delete(':projectId/global-params/:paramId')
  @RequireProjectMember()
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
