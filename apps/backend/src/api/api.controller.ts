import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ProjectPermissions } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { ApiService } from './api.service'
import { ApiBriefDto, ApiDetailDto, ApisDto } from './dto/api.dto'
import { CloneApiReqDto } from './dto/clone-api.dto'
import { CreateApiReqDto } from './dto/create-api.dto'
import { GetApisReqDto } from './dto/get-apis.dto'
import { SortItemsReqDto } from './dto/sort-items.dto'
import { UpdateApiReqDto } from './dto/update-api.dto'

@Controller('api')
@UseGuards(AuthGuard, PermissionsGuard)
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  /** 创建 API */
  @Post(':projectId/apis')
  @ProjectPermissions(['api:create'], 'projectId')
  @ResMsg('API 创建成功')
  async createAPI(
    @Param('projectId') projectId: string,
    @Body() dto: CreateApiReqDto,
    @ReqUser('id') userId: string,
  ): Promise<ApiBriefDto> {
    const result = await this.apiService.createAPI(dto, projectId, userId)
    return plainToInstance(ApiBriefDto, result)
  }

  /** 查询 API 列表 */
  @Get(':projectId/apis')
  @ProjectPermissions(['project:read'])
  @ResMsg('API 列表获取成功')
  async getAPIList(
    @Param('projectId') projectId: string,
    @Query() dto: GetApisReqDto,
    @ReqUser('id') userId: string,
  ): Promise<ApisDto> {
    const result = await this.apiService.getAPIList(dto, projectId, userId)
    return plainToInstance(ApisDto, result)
  }

  /** 获取某 API 详情信息 */
  @Get(':projectId/apis/:apiId')
  @ProjectPermissions(['api:read'])
  @ResMsg('API 详情获取成功')
  async getAPIDetail(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
    @ReqUser('id') userId: string,
  ): Promise<ApiDetailDto> {
    const result = await this.apiService.getAPIDetail(apiId, projectId, userId)
    return plainToInstance(ApiDetailDto, result)
  }

  /** 更新 API 信息 */
  @Patch(':projectId/apis/:apiId')
  @ProjectPermissions(['api:write'])
  @ResMsg('API 更新成功')
  async updateAPI(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
    @Body() dto: UpdateApiReqDto,
    @ReqUser('id') userId: string,
  ): Promise<ApiBriefDto> {
    const result = await this.apiService.updateAPI(dto, apiId, projectId, userId)
    return plainToInstance(ApiBriefDto, result)
  }

  /** 删除 API */
  @Delete(':projectId/apis/:apiId')
  @ProjectPermissions(['api:delete'])
  @ResMsg('API 删除成功')
  async deleteAPI(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.apiService.deleteAPI(apiId, projectId, userId)
  }

  /** 复制 API */
  @Post(':projectId/apis/:apiId/clone')
  @ProjectPermissions(['api:create'], 'projectId')
  @ResMsg('API 复制成功')
  async cloneAPI(
    @Param('projectId') projectId: string,
    @Param('apiId') apiId: string,
    @Body() dto: CloneApiReqDto,
    @ReqUser('id') userId: string,
  ): Promise<ApiBriefDto> {
    const result = await this.apiService.cloneAPI(dto, apiId, projectId, userId)
    return plainToInstance(ApiBriefDto, result)
  }

  /** 批量更新 API 排序 */
  @Post(':projectId/apis/sort')
  @ProjectPermissions(['api:write'])
  @ResMsg('API 排序更新成功')
  async sortAPIs(
    @Param('projectId') projectId: string,
    @Body() dto: SortItemsReqDto,
    @ReqUser('id') userId: string,
  ): Promise<void> {
    await this.apiService.sortAPIs(dto, projectId, userId)
  }
}
