import { RoleType } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class UpdateRoleReqDto {
  @IsOptional()
  @IsString({ message: '角色名称必须是字符串' })
  name?: string

  @IsOptional()
  @IsString({ message: '角色描述必须是字符串' })
  description?: string

  @IsOptional()
  @IsEnum(RoleType, { message: '角色类型必须是有效的枚举值' })
  type?: RoleType
}
