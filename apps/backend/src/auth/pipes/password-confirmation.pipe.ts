import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { RegisterDto } from '../dto/register.dto'

/**
 * 密码确认验证管道
 * 确保两次输入的密码一致
 */
@Injectable()
export class PasswordConfirmationPipe implements PipeTransform {
  transform(value: RegisterDto, metadata: ArgumentMetadata): RegisterDto {
    if (metadata.type === 'body' && value.password && value.confirmPassword) {
      if (value.password !== value.confirmPassword) {
        throw new HanaException('两次密码输入不一致', ErrorCode.PASSWORD_MISMATCH, 400)
      }
    }
    return value
  }
}
