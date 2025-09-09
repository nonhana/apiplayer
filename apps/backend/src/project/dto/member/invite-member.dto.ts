import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

/** 邀请项目成员请求 DTO */
export class InviteMemberReqDto {
  /** 用户邮箱 */
  @IsNotEmpty({ message: '用户邮箱不能为空' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string

  /** 角色 ID */
  @IsNotEmpty({ message: '角色 ID 不能为空' })
  @IsString({ message: '角色 ID 必须是字符串' })
  roleId: string
}
