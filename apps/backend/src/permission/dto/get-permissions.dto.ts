import { IsOptional, IsString } from 'class-validator'

export class QueryPermissionsDto {
  @IsOptional()
  @IsString({ message: '资源类型必须是字符串' })
  resource?: string

  @IsOptional()
  @IsString({ message: '操作类型必须是字符串' })
  action?: string

  @IsOptional()
  @IsString({ message: '关键词必须是字符串' })
  keyword?: string
}
