import { Type } from 'class-transformer'
import { IsOptional, ValidateNested } from 'class-validator'
import { UpdateApiBaseInfoDto, UpdateApiCoreInfoDto, UpdateApiVersionInfoDto } from '../update-api.dto'

/** 创建草稿版本请求 DTO */
export class CreateVersionReqDto {
  /** 基本信息（覆盖快照默认值） */
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateApiBaseInfoDto)
  baseInfo?: UpdateApiBaseInfoDto

  /** 核心信息（快照数据） */
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateApiCoreInfoDto)
  coreInfo?: UpdateApiCoreInfoDto

  /** 版本信息 */
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateApiVersionInfoDto)
  versionInfo?: UpdateApiVersionInfoDto
}
