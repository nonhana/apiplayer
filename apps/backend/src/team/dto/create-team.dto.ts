import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator'

export class CreateTeamReqDto {
  @IsNotEmpty({ message: '团队名称不能为空' })
  @IsString({ message: '团队名称必须是字符串' })
  @MinLength(2, { message: '团队名称长度不能少于 2 个字符' })
  @MaxLength(50, { message: '团队名称长度不能超过 50 个字符' })
  name: string

  @IsNotEmpty({ message: '团队标识符不能为空' })
  @IsString({ message: '团队标识符必须是字符串' })
  @MinLength(2, { message: '团队标识符长度不能少于 2 个字符' })
  @MaxLength(30, { message: '团队标识符长度不能超过 30 个字符' })
  slug: string

  @IsOptional()
  @IsString({ message: '团队描述必须是字符串' })
  @MaxLength(500, { message: '团队描述长度不能超过 500 个字符' })
  description?: string

  @IsOptional()
  @IsUrl({}, { message: '团队头像必须是有效的 URL' })
  avatar?: string
}
