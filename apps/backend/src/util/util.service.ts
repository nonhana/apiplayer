import type { MultipartFile } from '@fastify/multipart'
import type { AbstractMailService, MailProvider, SendMailInput, SendMailResult } from '@/infra/email/email.types'
import type { AbstractUploadService, UploadFileInput, UploadFileResult, UploadMode } from '@/infra/upload/upload.types'
import { faker } from '@faker-js/faker'
import { Injectable, Optional } from '@nestjs/common'
import { JSONSchemaFaker, Schema } from 'json-schema-faker'
import { JsonValue } from 'type-fest'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { ResendMailService } from '@/infra/email/resend-mail.service'
import { LocalUploadService } from '@/infra/upload/local-upload.service'
import { R2Service } from '@/infra/upload/r2.service'

@Injectable()
export class UtilService {
  // CONFIG: 手动配置上传模式
  private readonly uploadMode: UploadMode = 'r2'
  private readonly uploadServices: Partial<Record<UploadMode, AbstractUploadService>>

  // CONFIG: 手动配置邮件提供商
  private readonly mailProvider: MailProvider = 'resend'
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

  async uploadFile(file: MultipartFile): Promise<UploadFileResult> {
    const service = this.uploadServices[this.uploadMode]
    if (!service) {
      throw new HanaException(
        `当前未配置上传模式 "${this.uploadMode}" 对应的实现，请检查服务模块导入或环境配置`,
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

  async sendMail(input: SendMailInput): Promise<SendMailResult> {
    const mailProvider: MailProvider = this.mailProvider

    const service = this.mailServices[mailProvider]
    if (!service) {
      throw new HanaException(
        `当前未配置邮件提供商 "${mailProvider}" 对应的实现，请检查服务模块导入或环境配置`,
        ErrorCode.INVALID_PARAMS,
      )
    }

    return service.sendMail(input)
  }

  /** 根据 JSON Schema 生成示例数据 */
  async getSchemaMock(schema: Schema): Promise<JsonValue> {
    JSONSchemaFaker.extend('faker', () => faker)
    return await JSONSchemaFaker.resolve(schema)
  }
}
