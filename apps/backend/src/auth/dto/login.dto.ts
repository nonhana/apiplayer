import { Exclude, Expose, Type } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'
import { MessageResDto } from '@/common/dto/message.dto'
import { UserBriefInfoDto } from '@/common/dto/user.dto'

export class LoginReqDto {
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

@Exclude()
export class LoginResDto extends MessageResDto {
  @Expose()
  token: string

  @Expose()
  @Type(() => UserBriefInfoDto)
  user: UserBriefInfoDto
}
