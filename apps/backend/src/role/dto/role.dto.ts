import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'

/**
 * 创建角色 DTO
 */
export class CreateRoleDto {
  @IsString({ message: '角色名称必须是字符串' })
  @IsNotEmpty({ message: '角色名称不能为空' })
  name: string

  @IsOptional()
  @IsString({ message: '角色描述必须是字符串' })
  description?: string

  @IsOptional()
  @IsBoolean({ message: '是否系统角色必须是布尔值' })
  isSystem?: boolean

  @IsOptional()
  @IsArray({ message: '权限列表必须是数组' })
  @IsString({ each: true, message: '权限ID必须是字符串' })
  permissionIds?: string[]
}

/**
 * 更新角色 DTO
 */
export class UpdateRoleDto {
  @IsOptional()
  @IsString({ message: '角色名称必须是字符串' })
  name?: string

  @IsOptional()
  @IsString({ message: '角色描述必须是字符串' })
  description?: string

  @IsOptional()
  @IsBoolean({ message: '是否系统角色必须是布尔值' })
  isSystem?: boolean
}

/**
 * 角色权限分配 DTO
 */
export class AssignRolePermissionsDto {
  @IsArray({ message: '权限列表必须是数组' })
  @IsString({ each: true, message: '权限ID必须是字符串' })
  permissionIds: string[]
}

/**
 * 用户角色分配 DTO
 */
export class AssignUserRolesDto {
  @IsArray({ message: '角色列表必须是数组' })
  @IsString({ each: true, message: '角色ID必须是字符串' })
  roleIds: string[]

  @IsOptional()
  @IsString({ message: '团队ID必须是字符串' })
  teamId?: string

  @IsOptional()
  @IsString({ message: '项目ID必须是字符串' })
  projectId?: string
}

/**
 * 角色查询 DTO
 */
export class QueryRolesDto {
  @IsOptional()
  @IsString({ message: '关键词必须是字符串' })
  keyword?: string

  @IsOptional()
  @IsBoolean({ message: '是否系统角色必须是布尔值' })
  isSystem?: boolean
}

/**
 * 权限响应 DTO（用于角色详情）
 */
export class RolePermissionDto {
  id: string
  name: string
  description?: string
  resource: string
  action: string
}

/**
 * 角色响应 DTO
 */
export class RoleResponseDto {
  id: string
  name: string
  description?: string
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
  permissions?: RolePermissionDto[]
}

/**
 * 角色列表响应 DTO
 */
export class RolesListResponseDto {
  roles: RoleResponseDto[]
  total: number
}

/**
 * 用户角色上下文 DTO
 */
export class UserRoleContextDto {
  userId: string
  teamRoles?: Array<{
    teamId: string
    teamName: string
    role: RoleResponseDto
  }>

  projectRoles?: Array<{
    projectId: string
    projectName: string
    role: RoleResponseDto
  }>
}
