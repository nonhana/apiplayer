import { IsEnum, IsOptional, IsString } from 'class-validator'
import { RoleType } from 'prisma/generated/client'

export class GetRolesReqDto {
  @IsOptional()
  @IsString({ message: '关键词必须是字符串' })
  keyword?: string

  @IsOptional()
  @IsEnum(RoleType, { message: '角色类型必须是有效的枚举值' })
  type?: RoleType
}
