import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common'
import { RequireSystemAdmin } from '@/common/decorators/permissions.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import {
  AssignRolePermissionsDto,
  CreateRoleDto,
  QueryRolesDto,
  RoleResponseDto,
  RolesListResponseDto,
  UpdateRoleDto,
} from './dto/role.dto'
import { RoleService } from './role.service'

@Controller('roles')
@UseGuards(AuthGuard, PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * 创建角色
   */
  @Post()
  @RequireSystemAdmin()
  async createRole(@Body() createDto: CreateRoleDto): Promise<RoleResponseDto> {
    return await this.roleService.createRole(createDto)
  }

  /**
   * 获取角色列表
   */
  @Get()
  @RequireSystemAdmin()
  async getRoles(@Query() queryDto: QueryRolesDto): Promise<RolesListResponseDto> {
    return await this.roleService.getRoles(queryDto)
  }

  /**
   * 获取角色详情
   */
  @Get(':id')
  @RequireSystemAdmin()
  async getRoleById(@Param('id') id: string): Promise<RoleResponseDto> {
    return await this.roleService.getRoleById(id)
  }

  /**
   * 更新角色基本信息
   */
  @Patch(':id')
  @RequireSystemAdmin()
  async updateRole(
    @Param('id') id: string,
    @Body() updateDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return await this.roleService.updateRole(id, updateDto)
  }

  /**
   * 为角色分配权限
   */
  @Put(':id/permissions')
  @RequireSystemAdmin()
  async assignPermissions(
    @Param('id') id: string,
    @Body() assignDto: AssignRolePermissionsDto,
  ): Promise<RoleResponseDto> {
    return await this.roleService.assignPermissions(id, assignDto)
  }

  /**
   * 删除角色
   */
  @Delete(':id')
  @RequireSystemAdmin()
  async deleteRole(@Param('id') id: string): Promise<{ message: string }> {
    await this.roleService.deleteRole(id)
    return { message: '角色删除成功' }
  }
}
