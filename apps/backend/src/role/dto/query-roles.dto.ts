import { IsEnum, IsOptional, IsString } from 'class-validator'
import { ROLE_CATEGORIES, RoleCategory } from '@/constants/role'

export class QueryRolesDto {
  @IsOptional()
  @IsString({ message: '关键词必须是字符串' })
  keyword?: string

  @IsOptional()
  @IsEnum(ROLE_CATEGORIES, { message: '角色类型必须是有效的枚举值' })
  type?: RoleCategory
}
