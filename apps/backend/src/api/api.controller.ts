import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ProjectPermissions } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { ApiService } from './api.service'
import { ApiBriefDto, ApiDetailDto, ApisDto } from './dto/api.dto'
import { CreateApiReqDto } from './dto/create-api.dto'
import { GetApisReqDto } from './dto/get-apis.dto'

@Controller('api')
@UseGuards(AuthGuard, PermissionsGuard)
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post(':projectId/apis')
  @ProjectPermissions(['api:create'])
  @ResMsg('API 创建成功')
  async createAPI(
    @Param('projectId') projectId: string,
    @Body() dto: CreateApiReqDto,
    @ReqUser('id') userId: string,
  ): Promise<ApiBriefDto> {
    const result = await this.apiService.createAPI(dto, projectId, userId)
    return plainToInstance(ApiBriefDto, result)
  }

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
}
