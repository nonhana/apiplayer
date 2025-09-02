import { Exclude, Expose } from 'class-transformer'
import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator'

export class CheckAvailabilityReqDto {
  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string

  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @Length(3, 20, { message: '用户名长度必须在3-20位之间' })
  @Matches(/^[\w-]+$/, {
    message: '用户名只能包含字母、数字、下划线和连字符',
  })
  username?: string
}

@Exclude()
export class CheckAvailabilityResDto {
  @Expose() available: boolean
  @Expose() message: string
}
