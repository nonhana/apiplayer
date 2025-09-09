import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { RequireSystemAdmin } from '@/common/decorators/permissions.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import {
  AssignPermissionsReqDto,
  CreateRoleReqDto,
  GetRolesReqDto,
  RoleDto,
  RolesDto,
  UpdateRoleReqDto,
} from './dto'
import { RoleService } from './role.service'

@Controller('roles')
@UseGuards(AuthGuard, PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /** 创建角色 */
  @Post()
  @RequireSystemAdmin()
  async createRole(@Body() createDto: CreateRoleReqDto): Promise<RoleDto> {
    const newRole = await this.roleService.createRole(createDto)
    return plainToInstance(RoleDto, newRole)
  }

  /** 获取角色列表 */
  @Get()
  @RequireSystemAdmin()
  async getRoles(@Query() queryDto: GetRolesReqDto): Promise<RolesDto> {
    const newRoles = await this.roleService.getRoles(queryDto)
    return plainToInstance(RolesDto, newRoles)
  }

  /** 获取角色详情 */
  @Get(':id')
  @RequireSystemAdmin()
  async getRoleById(@Param('id') id: string): Promise<RoleDto> {
    const result = await this.roleService.getRoleById(id)
    return plainToInstance(RoleDto, result)
  }

  /** 更新角色基本信息 */
  @Patch(':id')
  @RequireSystemAdmin()
  async updateRole(
    @Param('id') id: string,
    @Body() updateDto: UpdateRoleReqDto,
  ): Promise<RoleDto> {
    const updatedRole = await this.roleService.updateRole(id, updateDto)
    return plainToInstance(RoleDto, updatedRole)
  }

  /** 为角色分配权限 */
  @Put(':id/permissions')
  @RequireSystemAdmin()
  async assignPermissions(
    @Param('id') id: string,
    @Body() assignDto: AssignPermissionsReqDto,
  ): Promise<RoleDto> {
    const updatedRole = await this.roleService.assignPermissions(id, assignDto)
    return plainToInstance(RoleDto, updatedRole)
  }

  /** 删除角色 */
  @Delete(':id')
  @RequireSystemAdmin()
  @ResMsg('角色删除成功')
  async deleteRole(@Param('id') id: string): Promise<void> {
    await this.roleService.deleteRole(id)
  }
}
