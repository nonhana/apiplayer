import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { Permissions } from '@/common/decorators/permissions.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import {
  BatchCreateGlobalParamsDto,
  BatchCreateGlobalParamsResponseDto,
  CreateGlobalParamDto,
  CreateGlobalParamResponseDto,
  DeleteGlobalParamResponseDto,
  GlobalParamQueryDto,
  GlobalParamsResponseDto,
  UpdateGlobalParamDto,
  UpdateGlobalParamResponseDto,
} from './dto'
import { ProjectGlobalParamService } from './project-global-param.service'

@Controller('projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectGlobalParamController {
  @Inject(ProjectGlobalParamService)
  private readonly projectGlobalParamService: ProjectGlobalParamService

  /**
   * 创建全局参数
   * 需要全局参数管理权限
   */
  @Post(':projectId/global-params')
  @Permissions('global_param:manage')
  async createGlobalParam(
    @Param('projectId') projectId: string,
    @Body() createParamDto: CreateGlobalParamDto,
    @Req() request: FastifyRequest,
  ): Promise<CreateGlobalParamResponseDto> {
    const user = request.user!
    return await this.projectGlobalParamService.createGlobalParam(projectId, createParamDto, user.id)
  }

  /**
   * 批量创建全局参数
   * 需要全局参数管理权限
   */
  @Post(':projectId/global-params/batch')
  @Permissions('global_param:manage')
  async batchCreateGlobalParams(
    @Param('projectId') projectId: string,
    @Body() batchCreateDto: BatchCreateGlobalParamsDto,
    @Req() request: FastifyRequest,
  ): Promise<BatchCreateGlobalParamsResponseDto> {
    const user = request.user!
    return await this.projectGlobalParamService.batchCreateGlobalParams(projectId, batchCreateDto, user.id)
  }

  /**
   * 获取全局参数列表
   * 需要项目读取权限
   */
  @Get(':projectId/global-params')
  @Permissions('project:read')
  async getGlobalParams(
    @Param('projectId') projectId: string,
    @Query() query: GlobalParamQueryDto,
    @Req() request: FastifyRequest,
  ): Promise<GlobalParamsResponseDto> {
    const user = request.user!
    return await this.projectGlobalParamService.getGlobalParams(projectId, user.id, query)
  }

  /**
   * 更新全局参数
   * 需要全局参数管理权限
   */
  @Patch(':projectId/global-params/:paramId')
  @Permissions('global_param:manage')
  async updateGlobalParam(
    @Param('projectId') projectId: string,
    @Param('paramId') paramId: string,
    @Body() updateParamDto: UpdateGlobalParamDto,
    @Req() request: FastifyRequest,
  ): Promise<UpdateGlobalParamResponseDto> {
    const user = request.user!
    return await this.projectGlobalParamService.updateGlobalParam(projectId, paramId, updateParamDto, user.id)
  }

  /**
   * 删除全局参数
   * 需要全局参数管理权限
   */
  @Delete(':projectId/global-params/:paramId')
  @Permissions('global_param:manage')
  async deleteGlobalParam(
    @Param('projectId') projectId: string,
    @Param('paramId') paramId: string,
    @Req() request: FastifyRequest,
  ): Promise<DeleteGlobalParamResponseDto> {
    const user = request.user!
    return await this.projectGlobalParamService.deleteGlobalParam(projectId, paramId, user.id)
  }
}
