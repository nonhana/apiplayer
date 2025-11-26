import type { MultipartFile } from '@fastify/multipart'
import type { FastifyRequest } from 'fastify'
import type { UploadMode } from '@/infra/upload/upload.types'
import { BadRequestException, Controller, Post, Query, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@/common/guards/auth.guard'
import { UPLOADS_URL_PREFIX } from '@/constants/file-upload'
import { UtilService } from './util.service'

interface MultipartUploadRequest extends FastifyRequest {
  file: () => Promise<MultipartFile | undefined>
}

@Controller('util')
@UseGuards(AuthGuard)
export class UtilController {
  constructor(private readonly utilService: UtilService) {}

  /**
   * 上传文件
   *
   * @description 指定上传模式，调用对应上传服务
   */
  @Post('upload')
  async uploadFile(
    @Req() req: MultipartUploadRequest,
    @Query('mode') mode?: UploadMode,
  ): Promise<{ url: string }> {
    const multipartFile = await req.file()

    if (!multipartFile) {
      throw new BadRequestException('未检测到上传文件，请确认 FormData 中包含字段 "file"')
    }

    const result = await this.utilService.uploadFile(multipartFile, mode)
    const host = req.headers.host

    if (!host) {
      throw new BadRequestException('无法解析请求 Host 头信息')
    }

    const fileUrl = result.url ?? `${req.protocol}://${host}${UPLOADS_URL_PREFIX}/${result.key}`

    return {
      url: fileUrl,
    }
  }
}
