import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateMemberReqDto {
  @IsNotEmpty({ message: '角色 ID 不能为空' })
  @IsString({ message: '角色 ID 必须是字符串' })
  roleId: string

  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称长度不能超过 50 个字符' })
  nickname?: string
}
