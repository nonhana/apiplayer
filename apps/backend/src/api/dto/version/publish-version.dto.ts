import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator'

/** 发布版本请求 DTO */
export class PublishVersionReqDto {
  /** 版本号，格式：vX.X.X */
  @IsNotEmpty({ message: '版本号不能为空' })
  @IsString({ message: '版本号必须是字符串' })
  @Matches(/^v\d+\.\d+\.\d+$/, { message: '版本号格式必须为 vX.X.X，如 v1.0.0' })
  version: string

  /** 版本摘要（可选） */
  @IsOptional()
  @IsString({ message: '版本摘要必须是字符串' })
  @MaxLength(1024, { message: '版本摘要长度不能超过 1024 个字符' })
  summary?: string

  /** 变更日志（可选） */
  @IsOptional()
  @IsString({ message: '变更日志必须是字符串' })
  @MaxLength(2048, { message: '变更日志长度不能超过 2048 个字符' })
  changelog?: string
}
