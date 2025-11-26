import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ErrorCode } from '@/common/exceptions/error-code'
import { HanaException } from '@/common/exceptions/hana.exception'
import {
  AbstractUploadService,
  type UploadFileInput,
  type UploadFileResult,
  type UploadMode,
} from '@/infra/upload/upload.types'

interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  domain: string
}

@Injectable()
export class R2Service extends AbstractUploadService {
  readonly mode: UploadMode = 'r2'

  private S3: S3Client
  private bucket: string
  private r2Config: R2Config

  constructor(private readonly configService: ConfigService) {
    super()
    const tempConfig = {
      accountId: this.configService.get('R2_ACCOUNT_ID'),
      accessKeyId: this.configService.get('R2_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('R2_SECRET_ACCESS_KEY'),
      bucket: this.configService.get('R2_BUCKET'),
      domain: this.configService.get('R2_DOMAIN'),
    }

    if (!tempConfig.accountId || !tempConfig.accessKeyId || !tempConfig.secretAccessKey || !tempConfig.bucket || !tempConfig.domain) {
      throw new HanaException('R2 configuration is not complete', ErrorCode.ENV_CONFIG_ERROR, 500)
    }

    this.r2Config = tempConfig

    this.S3 = new S3Client({
      region: 'apac',
      endpoint: `https://${this.r2Config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.r2Config.accessKeyId,
        secretAccessKey: this.r2Config.secretAccessKey,
      },
    })
    this.bucket = this.r2Config.bucket
  }

  async uploadFile(input: UploadFileInput): Promise<UploadFileResult> {
    const originalFilename = input.filename || 'file'
    const fileExt = extname(originalFilename)
    const randomName = randomUUID()
    const storedKey = `${randomName}${fileExt}`

    const buffer = await this.streamToBuffer(input.stream)
    const url = await this.uploadFileToR2(buffer, storedKey)

    return {
      key: storedKey,
      url,
    }
  }

  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Uint8Array[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }

  private uploadFileToR2(buffer: Buffer, targetPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const putCommand = new PutObjectCommand({
        Bucket: this.bucket,
        Key: targetPath,
        Body: buffer,
      })
      this.S3.send(putCommand)
        .then(() => {
          resolve(`https://${this.r2Config.domain}/${targetPath}`)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  // 删除 Cloudflare R2 中的文件
  deleteFileFromR2 = (targetPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: targetPath,
      })
      this.S3.send(deleteCommand)
        .then(() => {
          resolve()
        })
        .catch((error) => {
          reject(error)
        })
    })
  }
}
