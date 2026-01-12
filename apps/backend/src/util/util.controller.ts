import type { MultipartFile } from '@fastify/multipart'
import type { FastifyRequest } from 'fastify'
import type { MailProvider } from '@/infra/email/email.types'
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Schema } from 'json-schema-faker'
import { JsonValue } from 'type-fest'
import { Public } from '@/common/decorators/public.decorator'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import { AuthGuard } from '@/common/guards/auth.guard'
import { UPLOADS_URL_PREFIX } from '@/constants/file-upload'
import { TeamInviteMode } from '@/constants/system-config'
import { SendEmailDto } from './dto/send-email.dto'
import { UtilService } from './util.service'

interface MultipartUploadRequest extends FastifyRequest {
  file: () => Promise<MultipartFile | undefined>
}

/** 公开配置响应类型 */
interface PublicConfigResponse {
  teamInviteMode: TeamInviteMode
}

@Controller('util')
@UseGuards(AuthGuard)
export class UtilController {
  constructor(
    private readonly utilService: UtilService,
    private readonly configService: ConfigService,
  ) {}

  /** 上传文件 */
  @Post('upload')
  async uploadFile(
    @Req() req: MultipartUploadRequest,
  ): Promise<{ url: string }> {
    const multipartFile = await req.file()

    if (!multipartFile) {
      throw new HanaException('未检测到上传文件，请确认 FormData 中包含字段 "file"', ErrorCode.INVALID_PARAMS, 400)
    }

    const result = await this.utilService.uploadFile(multipartFile)
    const host = req.headers.host

    if (!host) {
      throw new HanaException('无法解析请求 Host 头信息', ErrorCode.INTERNAL_SERVER_ERROR, 500)
    }

    const fileUrl = result.url ?? `${req.protocol}://${host}${UPLOADS_URL_PREFIX}/${result.key}`

    return {
      url: fileUrl,
    }
  }

  /** 发送邮件 */
  @Post('email/send')
  async sendEmail(
    @Body() body: SendEmailDto,
  ): Promise<{ id?: string, provider: MailProvider }> {
    const result = await this.utilService.sendMail({
      to: body.to,
      subject: body.subject,
      text: body.text,
      html: body.html,
    })

    return {
      id: result.id,
      provider: result.provider,
    }
  }

  /** 生成 Schema mock 数据 */
  @Post('schema-mock')
  async getSchemaMock(
    @Body() body: Schema,
  ): Promise<JsonValue> {
    const result = await this.utilService.getSchemaMock(body)
    return result
  }

  /** 获取公开配置（无需登录） */
  @Public()
  @Get('config/public')
  getPublicConfig(): PublicConfigResponse {
    const teamInviteMode = this.configService.get<TeamInviteMode>('TEAM_INVITE_MODE') ?? 'direct'
    return {
      teamInviteMode,
    }
  }
}
