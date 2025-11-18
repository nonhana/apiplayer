import { IsInt, IsOptional, IsString, Min } from 'class-validator'

/** 移动 API 分组请求 DTO */
export class MoveGroupReqDto {
  /** 新的父分组 ID */
  @IsOptional()
  @IsString({ message: '新的父分组ID必须是字符串' })
  newParentId?: string

  /** 调整后的排序序号 */
  @IsOptional()
  @IsInt({ message: '排序序号必须是整数' })
  @Min(0, { message: '排序序号必须大于等于 0' })
  sortOrder?: number
}
