import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'

/** 单个排序项 DTO */
export class SortItemDto {
  /** 需要调整排序的实体 ID */
  @IsString({ message: 'ID 必须是字符串' })
  id: string

  /** 排序序号 */
  @IsInt({ message: '排序序号必须是整数' })
  @Min(0, { message: '排序序号必须大于等于 0' })
  sortOrder: number
}

/** 批量排序请求 DTO */
export class SortItemsReqDto {
  /** 排序项列表 */
  @IsArray({ message: '排序项列表必须是数组' })
  @ArrayMinSize(1, { message: '排序项列表不能为空' })
  @ValidateNested({ each: true })
  @Type(() => SortItemDto)
  items: SortItemDto[]
}
