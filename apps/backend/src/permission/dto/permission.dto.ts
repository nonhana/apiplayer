import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator'

/**
 * 创建权限 DTO
 */
export class CreatePermissionDto {
  @IsString({ message: '权限名称必须是字符串' })
  @IsNotEmpty({ message: '权限名称不能为空' })
  name: string

  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  description?: string

  @IsString({ message: '资源类型必须是字符串' })
  @IsNotEmpty({ message: '资源类型不能为空' })
  resource: string

  @IsString({ message: '操作类型必须是字符串' })
  @IsNotEmpty({ message: '操作类型不能为空' })
  action: string
}

/**
 * 更新权限 DTO
 */
export class UpdatePermissionDto {
  @IsOptional()
  @IsString({ message: '权限名称必须是字符串' })
  name?: string

  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  description?: string

  @IsOptional()
  @IsString({ message: '资源类型必须是字符串' })
  resource?: string

  @IsOptional()
  @IsString({ message: '操作类型必须是字符串' })
  action?: string
}

/**
 * 权限查询 DTO
 */
export class QueryPermissionsDto {
  @IsOptional()
  @IsString({ message: '资源类型必须是字符串' })
  resource?: string

  @IsOptional()
  @IsString({ message: '操作类型必须是字符串' })
  action?: string

  @IsOptional()
  @IsString({ message: '关键词必须是字符串' })
  keyword?: string
}

/**
 * 权限响应 DTO
 */
export class PermissionResponseDto {
  id: string
  name: string
  description?: string
  resource: string
  action: string
  createdAt: Date
}

/**
 * 权限列表响应 DTO
 */
export class PermissionsListResponseDto {
  permissions: PermissionResponseDto[]
  total: number
}

/**
 * 批量创建权限 DTO
 */
export class BatchCreatePermissionsDto {
  @IsArray({ message: '权限列表必须是数组' })
  @IsNotEmpty({ message: '权限列表不能为空' })
  permissions: CreatePermissionDto[]
}
