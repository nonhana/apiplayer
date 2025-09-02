import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common'
import { RegisterReqDto } from '@/auth/dto/register.dto'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'

@Injectable()
export class PasswordConfirmationPipe implements PipeTransform {
  transform(value: RegisterReqDto, metadata: ArgumentMetadata): RegisterReqDto {
    if (metadata.type === 'body' && value.password && value.confirmPassword) {
      if (value.password !== value.confirmPassword) {
        throw new HanaException('两次密码输入不一致', ErrorCode.PASSWORD_MISMATCH, 400)
      }
    }
    return value
  }
}
