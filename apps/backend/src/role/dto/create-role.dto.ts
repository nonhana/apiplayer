import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ROLE_CATEGORIES, RoleCategory } from '@/constants/role'

export class CreateRoleDto {
  @IsString({ message: '角色名称必须是字符串' })
  @IsNotEmpty({ message: '角色名称不能为空' })
  name: string

  @IsOptional()
  @IsString({ message: '角色描述必须是字符串' })
  description?: string

  @IsEnum(ROLE_CATEGORIES, { message: '角色类型必须是有效的枚举值' })
  @IsNotEmpty({ message: '角色类型不能为空' })
  type: RoleCategory

  @IsOptional()
  @IsArray({ message: '权限列表必须是数组' })
  @IsString({ each: true, message: '权限ID必须是字符串' })
  permissionIds?: string[]
}
