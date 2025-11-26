import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import {
  AbstractMailService,
  type MailProvider,
  type SendMailInput,
  type SendMailResult,
} from './email.types'

interface ResendConfig {
  apiKey: string
  defaultFrom: string
}

/**
 * 基于 Resend 的邮件发送实现。
 */
@Injectable()
export class ResendMailService extends AbstractMailService {
  readonly provider: MailProvider = 'resend'

  private readonly client: Resend
  private readonly config: ResendConfig

  constructor(private readonly configService: ConfigService) {
    super()

    const apiKey = this.configService.get<string>('RESEND_API_KEY')
    const defaultFrom = this.configService.get<string>('RESEND_FROM_EMAIL')

    if (!apiKey || !defaultFrom) {
      throw new HanaException(
        'Resend 邮件服务配置不完整，请检查 RESEND_API_KEY 与 RESEND_FROM_EMAIL',
        ErrorCode.ENV_CONFIG_ERROR,
        500,
      )
    }

    this.config = {
      apiKey,
      defaultFrom,
    }

    this.client = new Resend(this.config.apiKey)
  }

  async sendMail(input: SendMailInput): Promise<SendMailResult> {
    const from = input.from ?? this.config.defaultFrom

    const hasContent = Boolean(input.html) || Boolean(input.text)

    if (!hasContent) {
      throw new HanaException('邮件内容不能为空，请至少提供 text 或 html 之一', ErrorCode.INVALID_PARAMS)
    }

    const response = await this.client.emails.send(
      input.html || !input.text
        ? {
            from,
            to: input.to,
            subject: input.subject,
            html: input.html ?? input.text ?? '',
          }
        : {
            from,
            to: input.to,
            subject: input.subject,
            text: input.text,
          },
    )

    if (response.error) {
      throw new HanaException(
        `Resend 发送邮件失败: ${response.error.message}`,
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
      )
    }

    return {
      id: response.data?.id,
      provider: this.provider,
    }
  }
}
