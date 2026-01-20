import { IsEmail, IsNotEmpty } from 'class-validator'

export class EmailDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string
}
