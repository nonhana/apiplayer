import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { APIMethod } from 'prisma/generated/client'

export class CloneApiReqDto {
  @IsNotEmpty({ message: '目标分组ID不能为空' })
  @IsString({ message: '目标分组ID必须是字符串' })
  targetGroupId: string

  @IsOptional()
  @IsString({ message: 'API 名称必须是字符串' })
  @MinLength(1, { message: 'API 名称不能为空' })
  @MaxLength(128, { message: 'API 名称长度不能超过 128 个字符' })
  name?: string

  @IsOptional()
  @IsString({ message: 'API 路径必须是字符串' })
  @MinLength(1, { message: 'API 路径不能为空' })
  path?: string

  @IsOptional()
  @IsEnum(APIMethod, { message: '请求方法必须是有效的枚举值' })
  method?: APIMethod
}
