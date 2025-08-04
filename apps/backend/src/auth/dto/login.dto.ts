import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'

/**
 * 登录请求 DTO
 */
export class LoginDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string

  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string

  @IsOptional()
  rememberMe?: boolean
}

/**
 * 登录响应 DTO
 */
export class LoginResponseDto {
  message: string
  user: {
    id: string
    email: string
    username: string
    name: string
    avatar: string | null
  }
}
