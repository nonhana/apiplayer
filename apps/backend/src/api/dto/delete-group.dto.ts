import { Type } from 'class-transformer'
import { IsBoolean, IsOptional } from 'class-validator'

/** 删除 API 分组请求 DTO */
export class DeleteGroupReqDto {
  /** 是否级联删除子分组与分组下的 API */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: '级联删除标识必须是布尔值' })
  cascade?: boolean
}
