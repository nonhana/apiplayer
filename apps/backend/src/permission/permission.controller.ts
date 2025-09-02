import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { RequireSystemAdmin } from '@/common/decorators/permissions.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { CreatePermissionDto } from './dto/create-permission.dto'
import { CreatePermissionsDto } from './dto/create-permissions.dto'
import { QueryPermissionsDto } from './dto/get-permissions.dto'
import { PermissionDto } from './dto/permission.dto'
import { PermissionsDto } from './dto/permissions.dto'
import { UpdatePermissionDto } from './dto/update-permission.dto'
import { PermissionService } from './permission.service'

@Controller('permissions')
@UseGuards(AuthGuard, PermissionsGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /** 创建权限 */
  @Post()
  @RequireSystemAdmin()
  async createPermission(@Body() createDto: CreatePermissionDto): Promise<PermissionDto> {
    const newPermission = await this.permissionService.createPermission(createDto)
    return plainToInstance(PermissionDto, newPermission)
  }

  /** 批量创建权限 */
  @Post('batch')
  @RequireSystemAdmin()
  async batchCreatePermissions(@Body() createDto: CreatePermissionsDto): Promise<PermissionDto[]> {
    const newPermissions = await this.permissionService.createPermissions(createDto)
    return plainToInstance(PermissionDto, newPermissions)
  }

  /** 获取权限列表 */
  @Get()
  @RequireSystemAdmin()
  async getPermissions(@Query() queryDto: QueryPermissionsDto): Promise<PermissionsDto> {
    const res = await this.permissionService.getPermissions(queryDto)
    return plainToInstance(PermissionsDto, res)
  }

  /** 获取所有资源类型 */
  @Get('resources')
  @RequireSystemAdmin()
  async getResources(): Promise<{ resources: string[] }> {
    const resources = await this.permissionService.getResources()
    return { resources }
  }

  /** 根据资源类型获取权限列表 */
  @Get('by-resource/:resource')
  @RequireSystemAdmin()
  async getPermissionsByResource(@Param('resource') resource: string): Promise<PermissionDto[]> {
    const permissions = await this.permissionService.getPermissionsByResource(resource)
    return plainToInstance(PermissionDto, permissions)
  }

  /** 获取权限详情 */
  @Get(':id')
  @RequireSystemAdmin()
  async getPermissionById(@Param('id') id: string): Promise<PermissionDto> {
    const permission = await this.permissionService.getPermissionById(id)
    return plainToInstance(PermissionDto, permission)
  }

  /** 更新权限 */
  @Patch(':id')
  @RequireSystemAdmin()
  async updatePermission(
    @Param('id') id: string,
    @Body() updateDto: UpdatePermissionDto,
  ): Promise<PermissionDto> {
    const permission = await this.permissionService.updatePermission(id, updateDto)
    return plainToInstance(PermissionDto, permission)
  }

  /** 删除权限 */
  @Delete(':id')
  @RequireSystemAdmin()
  async deletePermission(@Param('id') id: string): Promise<{ message: string }> {
    await this.permissionService.deletePermission(id)
    return { message: '权限删除成功' }
  }
}
