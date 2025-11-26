import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { extname, join } from 'node:path'
import { Injectable } from '@nestjs/common'
import { UPLOADS_DIR } from '@/constants/file-upload'
import { AbstractUploadService, type UploadFileInput, type UploadFileResult, type UploadMode } from './upload.types'

@Injectable()
export class LocalUploadService extends AbstractUploadService {
  readonly mode: UploadMode = 'local'

  async uploadFile(input: UploadFileInput): Promise<UploadFileResult> {
    const originalFilename = input.filename || 'file'
    const fileExt = extname(originalFilename)
    const randomName = randomUUID()
    const storedFileName = `${randomName}${fileExt}`
    const targetPath = join(UPLOADS_DIR, storedFileName)

    await new Promise<void>((resolve, reject) => {
      const writeStream = createWriteStream(targetPath)
      input.stream.pipe(writeStream)

      writeStream.on('finish', () => resolve())
      writeStream.on('error', error => reject(error))
    })

    return {
      key: storedFileName,
    }
  }
}
