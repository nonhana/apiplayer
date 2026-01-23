import { Body, Controller, Post } from '@nestjs/common'
import { Public } from '@/common/decorators/public.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { EmailDto } from './dto'
import { EmailCodeService } from './email-code.service'

@Controller('email-code')
export class EmailCodeController {
  constructor(private readonly emailCodeService: EmailCodeService) {}

  /** 发送邮箱验证码 */
  @Public()
  @Post('send')
  @ResMsg('验证码已发送')
  async sendEmailCode(@Body() dto: EmailDto): Promise<void> {
    const { email } = dto
    await this.emailCodeService.sendEmailCode(email)
  }
}
