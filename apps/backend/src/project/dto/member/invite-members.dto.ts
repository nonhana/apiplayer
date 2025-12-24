import { Type } from 'class-transformer'
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator'

export class InviteMemberItemDto {
  /** 用户 ID */
  @IsNotEmpty({ message: '用户 ID 不能为空' })
  @IsString({ message: '用户 ID 必须是字符串' })
  userId: string

  /** 角色 ID */
  @IsNotEmpty({ message: '角色 ID 不能为空' })
  @IsString({ message: '角色 ID 必须是字符串' })
  roleId: string
}

/** 邀请项目成员请求 DTO */
export class InviteMembersReqDto {
  @IsArray({ message: '成员列表必须是数组' })
  @ArrayNotEmpty({ message: '成员列表不能为空' })
  @ValidateNested({ each: true })
  @Type(() => InviteMemberItemDto)
  members: InviteMemberItemDto[]
}
