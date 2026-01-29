import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator'

/** 冲突处理策略 */
export enum ConflictStrategy {
  /** 跳过冲突的 API */
  SKIP = 'skip',
  /** 覆盖现有 API */
  OVERWRITE = 'overwrite',
  /** 重命名新 API */
  RENAME = 'rename',
}

/** 解析 OpenAPI 文档请求 DTO（URL 或内容方式） */
export class ParseOpenapiReqDto {
  @IsOptional()
  @IsString({ message: 'OpenAPI 文档内容必须是字符串' })
  content?: string

  @IsOptional()
  @IsString({ message: 'OpenAPI 文档 URL 必须是字符串' })
  url?: string
}

/** 执行导入请求 DTO */
export class ExecuteImportReqDto {
  @IsString({ message: 'OpenAPI 文档内容必须是字符串' })
  content: string

  @IsEnum(ConflictStrategy, { message: '冲突处理策略必须是有效的枚举值' })
  conflictStrategy: ConflictStrategy

  @IsOptional()
  @IsString({ message: '目标分组ID必须是字符串' })
  targetGroupId?: string

  @IsOptional()
  @IsBoolean({ message: '是否自动创建分组必须是布尔值' })
  createMissingGroups?: boolean
}
