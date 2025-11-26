import type { MultipartFile } from '@fastify/multipart'
import type { AbstractMailService, MailProvider, SendMailInput, SendMailResult } from '@/infra/email/email.types'
import type { AbstractUploadService, UploadFileInput, UploadFileResult, UploadMode } from '@/infra/upload/upload.types'
import { Injectable, Optional } from '@nestjs/common'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { ResendMailService } from '@/infra/email/resend-mail.service'
import { LocalUploadService } from '@/infra/upload/local-upload.service'
import { R2Service } from '@/infra/upload/r2.service'

@Injectable()
export class UtilService {
  /** 整合上传服务到一个 Record */
  private readonly uploadServices: Partial<Record<UploadMode, AbstractUploadService>>

  /** 整合邮件服务到一个 Record */
  private readonly mailServices: Partial<Record<MailProvider, AbstractMailService>>

  constructor(
    private readonly localUploadService: LocalUploadService,
    @Optional() private readonly r2Service?: R2Service,
    @Optional() private readonly resendMailService?: ResendMailService,
  ) {
    this.uploadServices = {
      local: this.localUploadService,
      r2: this.r2Service,
    }

    this.mailServices = {
      resend: this.resendMailService,
    }
  }

  /**
   * 根据 `mode` 选择具体上传 service
   *
   * @param file Fastify multipart 上传的文件对象
   * @param mode 上传模式，默认为 `'local'`
   */
  async uploadFile(file: MultipartFile, mode?: UploadMode): Promise<UploadFileResult> {
    const uploadMode: UploadMode = mode ?? 'local'

    const service = this.uploadServices[uploadMode]
    if (!service) {
      throw new HanaException(
        `当前未配置上传模式 "${uploadMode}" 对应的实现，请检查服务模块导入或环境配置`,
        ErrorCode.INVALID_PARAMS,
      )
    }

    const input: UploadFileInput = {
      filename: file.filename ?? 'file',
      contentType: file.mimetype,
      stream: file.file,
    }

    return service.uploadFile(input)
  }

  /**
   * 根据 provider 选择具体邮件 service。
   *
   * @param input 邮件内容
   * @param provider 邮件提供商，默认为 'resend'
   */
  async sendMail(input: SendMailInput, provider?: MailProvider): Promise<SendMailResult> {
    const mailProvider: MailProvider = provider ?? 'resend'

    const service = this.mailServices[mailProvider]
    if (!service) {
      throw new HanaException(
        `当前未配置邮件提供商 "${mailProvider}" 对应的实现，请检查服务模块导入或环境配置`,
        ErrorCode.INVALID_PARAMS,
      )
    }

    return service.sendMail(input)
  }
}
