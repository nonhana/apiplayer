export type UploadMode = 'local' | 'r2'

/**
 * 标准化的上传文件输入结构。
 *
 * 业务层（如 Controller）负责从 HTTP 请求中解析出这些字段，
 * 上传实现仅关注如何存储与生成访问路径。
 */
export interface UploadFileInput {
  /**
   * 原始文件名，用于推断扩展名或记录元数据。
   */
  readonly filename: string

  /**
   * 文件内容类型（可选）。
   */
  readonly contentType?: string

  /**
   * 文件内容的可读流。
   */
  readonly stream: NodeJS.ReadableStream
}

/**
 * 上传实现返回的统一结果结构。
 */
export interface UploadFileResult {
  /**
   * 存储后的文件标识 / 路径（相对值），例如：
   * - 本地：`abc-uuid.png`
   * - 对象存储：`uploads/2025/xx/abc-uuid.png`
   */
  readonly key: string

  /**
   * 可选的完整访问 URL。
   *
   * 对于具有全局访问域名的对象存储（如 R2 / S3），
   * 可以在服务内部直接拼出完整 URL 并返回。
   * 对于本地存储，一般只返回 key，由上层结合请求协议与 Host 拼接 URL。
   */
  readonly url?: string
}

/**
 * 上传服务的抽象基类。
 *
 * 任意自定义上传实现只要继承该类，并在对应模块中注册为 Provider，
 * 即可被业务层通过 `mode` 进行选择性调用。
 */
export abstract class AbstractUploadService {
  /**
   * 上传模式标识，例如：
   * - `'local'`：本地磁盘
   * - `'r2'`：Cloudflare R2
   *
   * 该值将与前端传入的 `mode` 参数进行匹配。
   */
  abstract readonly mode: UploadMode

  /**
   * 执行实际的文件上传工作。
   */
  abstract uploadFile(input: UploadFileInput): Promise<UploadFileResult>
}
