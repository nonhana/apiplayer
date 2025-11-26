import { join } from 'node:path'
import { cwd } from 'node:process'

/**
 * 上传文件在服务器上的物理存储目录。
 *
 * 默认指向后端应用根目录下的 `uploads` 目录。
 */
export const UPLOADS_DIR = join(cwd(), 'uploads')

/**
 * 提供给外部访问上传文件的 URL 前缀。
 *
 * 例如：`/uploads/xxxx.png`
 */
export const UPLOADS_URL_PREFIX = '/uploads'
