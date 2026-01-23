import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common'
import { RegisterReqDto } from '@/auth/dto/register.dto'
import { HanaException } from '@/common/exceptions/hana.exception'

@Injectable()
export class PasswordConfirmationPipe implements PipeTransform {
  transform(value: RegisterReqDto, metadata: ArgumentMetadata): RegisterReqDto {
    if (metadata.type === 'body' && value.password && value.confirmPassword) {
      if (value.password !== value.confirmPassword) {
        throw new HanaException('PASSWORD_MISMATCH')
      }
    }
    return value
  }
}
