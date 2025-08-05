import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { Permissions } from '@/common/decorators/permissions.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import {
  BatchCreatePermissionsDto,
  CreatePermissionDto,
  PermissionResponseDto,
  PermissionsListResponseDto,
  QueryPermissionsDto,
  UpdatePermissionDto,
} from './dto/permission.dto'
import { PermissionService } from './permission.service'

@Controller('permissions')
@UseGuards(AuthGuard, PermissionsGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /**
   * 创建权限
   */
  @Post()
  @Permissions('system:config:write')
  async createPermission(@Body() createDto: CreatePermissionDto): Promise<PermissionResponseDto> {
    return await this.permissionService.createPermission(createDto)
  }

  /**
   * 批量创建权限
   */
  @Post('batch')
  @Permissions('system:config:write')
  async batchCreatePermissions(@Body() batchDto: BatchCreatePermissionsDto): Promise<PermissionResponseDto[]> {
    return await this.permissionService.batchCreatePermissions(batchDto)
  }

  /**
   * 获取权限列表
   */
  @Get()
  @Permissions('system:config:read')
  async getPermissions(@Query() queryDto: QueryPermissionsDto): Promise<PermissionsListResponseDto> {
    return await this.permissionService.getPermissions(queryDto)
  }

  /**
   * 获取所有资源类型
   */
  @Get('resources')
  @Permissions('system:config:read')
  async getResources(): Promise<{ resources: string[] }> {
    const resources = await this.permissionService.getResources()
    return { resources }
  }

  /**
   * 根据资源类型获取权限列表
   */
  @Get('by-resource/:resource')
  @Permissions('system:config:read')
  async getPermissionsByResource(@Param('resource') resource: string): Promise<PermissionResponseDto[]> {
    return await this.permissionService.getPermissionsByResource(resource)
  }

  /**
   * 获取权限详情
   */
  @Get(':id')
  @Permissions('system:config:read')
  async getPermissionById(@Param('id') id: string): Promise<PermissionResponseDto> {
    return await this.permissionService.getPermissionById(id)
  }

  /**
   * 更新权限
   */
  @Patch(':id')
  @Permissions('system:config:write')
  async updatePermission(
    @Param('id') id: string,
    @Body() updateDto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    return await this.permissionService.updatePermission(id, updateDto)
  }

  /**
   * 删除权限
   */
  @Delete(':id')
  @Permissions('system:config:write')
  async deletePermission(@Param('id') id: string): Promise<{ message: string }> {
    await this.permissionService.deletePermission(id)
    return { message: '权限删除成功' }
  }
}
