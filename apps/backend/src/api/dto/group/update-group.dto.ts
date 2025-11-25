import { IsInt, IsOptional, IsString, Min } from 'class-validator'

/** 更新 API 分组请求 DTO */
export class UpdateGroupReqDto {
  /** 分组名称 */
  @IsOptional()
  @IsString({ message: '分组名称必须是字符串' })
  name?: string

  /** 分组描述 */
  @IsOptional()
  @IsString({ message: '分组描述必须是字符串' })
  description?: string

  /** 排序序号 */
  @IsOptional()
  @IsInt({ message: '排序序号必须是整数' })
  @Min(0, { message: '排序序号必须大于等于 0' })
  sortOrder?: number
}
