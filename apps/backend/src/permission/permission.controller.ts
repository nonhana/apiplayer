import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { RequireSystemAdmin } from '@/common/decorators/permissions.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import {
  CreatePermissionReqDto,
  CreatePermissionsReqDto,
  GetPermissionsReqDto,
  PermissionDto,
  PermissionsDto,
  UpdatePermissionReqDto,
} from './dto'
import { PermissionService } from './permission.service'

@Controller('permissions')
@RequireSystemAdmin()
@UseGuards(AuthGuard, PermissionsGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /** 创建权限 */
  @Post()
  async createPermission(@Body() createDto: CreatePermissionReqDto): Promise<PermissionDto> {
    const newPermission = await this.permissionService.createPermission(createDto)
    return plainToInstance(PermissionDto, newPermission)
  }

  /** 批量创建权限 */
  @Post('batch')
  async batchCreatePermissions(@Body() createDto: CreatePermissionsReqDto): Promise<PermissionDto[]> {
    const newPermissions = await this.permissionService.createPermissions(createDto)
    return plainToInstance(PermissionDto, newPermissions)
  }

  /** 获取权限列表 */
  @Get()
  async getPermissions(@Query() queryDto: GetPermissionsReqDto): Promise<PermissionsDto> {
    const res = await this.permissionService.getPermissions(queryDto)
    return plainToInstance(PermissionsDto, res)
  }

  /** 获取所有资源类型 */
  @Get('resources')
  async getResources(): Promise<{ resources: string[] }> {
    const resources = await this.permissionService.getResources()
    return { resources }
  }

  /** 根据资源类型获取权限列表 */
  @Get('by-resource/:resource')
  async getPermissionsByResource(@Param('resource') resource: string): Promise<PermissionDto[]> {
    const permissions = await this.permissionService.getPermissionsByResource(resource)
    return plainToInstance(PermissionDto, permissions)
  }

  /** 获取权限详情 */
  @Get(':id')
  async getPermissionById(@Param('id') id: string): Promise<PermissionDto> {
    const permission = await this.permissionService.getPermissionById(id)
    return plainToInstance(PermissionDto, permission)
  }

  /** 更新权限 */
  @Patch(':id')
  async updatePermission(
    @Param('id') id: string,
    @Body() updateDto: UpdatePermissionReqDto,
  ): Promise<PermissionDto> {
    const permission = await this.permissionService.updatePermission(id, updateDto)
    return plainToInstance(PermissionDto, permission)
  }

  /** 删除权限 */
  @Delete(':id')
  @ResMsg('权限删除成功')
  async deletePermission(@Param('id') id: string): Promise<void> {
    await this.permissionService.deletePermission(id)
  }
}
