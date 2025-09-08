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
import { ProjectPermissions } from '@/common/decorators/permissions.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { CreateGlobalParamDto } from './dto/create-global-param.dto'
import { CreateGlobalParamsDto, CreateGlobalParamsResDto } from './dto/create-global-params.dto'
import { DeleteGlobalParamResDto } from './dto/delete-global-param.dto'
import { GetGlobalParamsDto } from './dto/get-global-params.dto'
import { GlobalParamDto } from './dto/global-param.dto'
import { GlobalParamsDto } from './dto/global-params.dto'
import { UpdateGlobalParamDto } from './dto/update-global-param.dto'
import { ProjectGlobalParamService } from './project-global-param.service'

@Controller('projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectGlobalParamController {
  constructor(
    private readonly projectGlobalParamService: ProjectGlobalParamService,
  ) {}

  /**
   * 创建全局参数
   * 需要全局参数管理权限
   */
  @Post(':projectId/global-params')
  @ProjectPermissions(['project:write'])
  async createGlobalParam(
    @Param('projectId') projectId: string,
    @Body() createParamDto: CreateGlobalParamDto,
    @Req() request: FastifyRequest,
  ): Promise<GlobalParamDto> {
    const user = request.user!
    const newGlobalParam = await this.projectGlobalParamService.createGlobalParam(projectId, createParamDto, user.id)
    return plainToInstance(GlobalParamDto, newGlobalParam)
  }

  /**
   * 批量创建全局参数
   * 需要全局参数管理权限
   */
  @Post(':projectId/global-params/batch')
  @ProjectPermissions(['project:write'])
  async createGlobalParams(
    @Param('projectId') projectId: string,
    @Body() dto: CreateGlobalParamsDto,
    @Req() request: FastifyRequest,
  ): Promise<CreateGlobalParamsResDto> {
    const user = request.user!
    const result = await this.projectGlobalParamService.createGlobalParams(projectId, dto, user.id)
    return plainToInstance(CreateGlobalParamsResDto, result)
  }

  /**
   * 获取全局参数列表
   * 需要项目读取权限
   */
  @Get(':projectId/global-params')
  @ProjectPermissions(['project:read'])
  async getGlobalParams(
    @Param('projectId') projectId: string,
    @Query() dto: GetGlobalParamsDto,
    @Req() request: FastifyRequest,
  ): Promise<GlobalParamsDto> {
    const user = request.user!
    const result = await this.projectGlobalParamService.getGlobalParams(projectId, user.id, dto)
    return plainToInstance(GlobalParamsDto, result)
  }

  /**
   * 更新全局参数
   * 需要全局参数管理权限
   */
  @Patch(':projectId/global-params/:paramId')
  @ProjectPermissions(['project:write'])
  async updateGlobalParam(
    @Param('projectId') projectId: string,
    @Param('paramId') paramId: string,
    @Body() updateParamDto: UpdateGlobalParamDto,
    @Req() request: FastifyRequest,
  ): Promise<GlobalParamDto> {
    const user = request.user!
    const result = await this.projectGlobalParamService.updateGlobalParam(projectId, paramId, updateParamDto, user.id)
    return plainToInstance(GlobalParamDto, result)
  }

  /**
   * 删除全局参数
   * 需要全局参数管理权限
   */
  @Delete(':projectId/global-params/:paramId')
  @ProjectPermissions(['project:write'])
  async deleteGlobalParam(
    @Param('projectId') projectId: string,
    @Param('paramId') paramId: string,
    @Req() request: FastifyRequest,
  ): Promise<DeleteGlobalParamResDto> {
    const user = request.user!
    return await this.projectGlobalParamService.deleteGlobalParam(projectId, paramId, user.id)
  }
}
