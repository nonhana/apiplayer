import { Type } from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator'

export class InviteMemberItemDto {
  @IsNotEmpty({ message: '用户 ID 不能为空' })
  @IsString({ message: '用户 ID 必须是字符串' })
  userId: string

  @IsNotEmpty({ message: '角色 ID 不能为空' })
  @IsString({ message: '角色 ID 必须是字符串' })
  roleId: string

  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称长度不能超过 50 个字符' })
  nickname?: string
}

export class InviteMembersReqDto {
  @IsArray({ message: '成员列表必须是数组' })
  @ArrayNotEmpty({ message: '成员列表不能为空' })
  @ValidateNested({ each: true })
  @Type(() => InviteMemberItemDto)
  members: InviteMemberItemDto[]
}
