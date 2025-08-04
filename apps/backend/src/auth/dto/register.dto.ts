import { IsEmail, IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator'

/**
 * 用户注册请求 DTO
 */
export class RegisterDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string

  @IsString({ message: '用户名必须是字符串' })
  @Length(3, 20, { message: '用户名长度必须在3-20位之间' })
  @Matches(/^[\w-]+$/, {
    message: '用户名只能包含字母、数字、下划线和连字符',
  })
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string

  @IsString({ message: '显示名称必须是字符串' })
  @Length(1, 50, { message: '显示名称长度必须在1-50位之间' })
  @IsNotEmpty({ message: '显示名称不能为空' })
  name: string

  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码长度不能少于8位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: '密码必须包含至少一个小写字母、一个大写字母和一个数字',
  })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string

  @IsString({ message: '确认密码必须是字符串' })
  @IsNotEmpty({ message: '确认密码不能为空' })
  confirmPassword: string
}

export type RegisterType = Omit<RegisterDto, ''>

/**
 * 注册响应 DTO
 */
export class RegisterResponseDto {
  message: string
  user: {
    id: string
    email: string
    username: string
    name: string
    avatar: string | null
    createdAt: Date
  }
}
