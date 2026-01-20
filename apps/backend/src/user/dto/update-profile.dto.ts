import { IsEmail, IsOptional, IsString, IsUrl, Length, Matches, MaxLength, MinLength } from 'class-validator'

/** 更新用户个人资料请求 DTO */
export class UpdateUserProfileReqDto {
  /** 昵称 / 展示名称 */
  @IsOptional()
  @IsString({ message: '显示名称必须是字符串' })
  @Length(1, 50, { message: '显示名称长度必须在 1-50 位之间' })
  name?: string

  /** 用户名 */
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @Length(3, 20, { message: '用户名长度必须在 3-20 位之间' })
  @Matches(/^[\w-]+$/, {
    message: '用户名只能包含字母、数字、下划线和连字符',
  })
  username?: string

  /** 头像地址 */
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: '头像地址必须是有效的 URL' })
  avatar?: string

  /** 个性签名 / 个人简介 */
  @IsOptional()
  @IsString({ message: '个人简介必须是字符串' })
  @MaxLength(200, { message: '个人简介长度不能超过 200 个字符' })
  bio?: string

  /** 新邮箱（变更邮箱时使用，需要配合邮箱验证码） */
  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  newEmail?: string

  /** 新密码（变更密码时使用，需要配合邮箱验证码） */
  @IsOptional()
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码长度不能少于 8 位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: '密码必须包含至少一个小写字母、一个大写字母和一个数字',
  })
  newPassword?: string

  /** 确认新密码（仅在修改密码时生效） */
  @IsOptional()
  @IsString({ message: '确认密码必须是字符串' })
  confirmNewPassword?: string

  /** 邮箱验证码（修改邮箱或密码时必填） */
  @IsOptional()
  @IsString({ message: '验证码必须是字符串' })
  @Length(6, 6, { message: '验证码必须是 6 位数字' })
  verificationCode?: string
}
