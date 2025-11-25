import { IsInt, IsOptional, IsString, Min } from 'class-validator'

// 创建分组请求 DTO
export class CreateGroupReqDto {
  @IsString({ message: '分组名称必须是字符串' })
  name: string

  @IsOptional()
  @IsString({ message: '父分组ID必须是字符串' })
  parentId?: string

  @IsOptional()
  @IsString({ message: '分组描述必须是字符串' })
  description?: string

  @IsOptional()
  @IsInt({ message: '排序序号必须是整数' })
  @Min(0, { message: '排序序号必须大于等于 0' })
  sortOrder?: number
}
