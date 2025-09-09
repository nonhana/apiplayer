import { IsOptional, IsString } from 'class-validator'

export class UpdatePermissionReqDto {
  @IsOptional()
  @IsString({ message: '权限名称必须是字符串' })
  name?: string

  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  description?: string

  @IsOptional()
  @IsString({ message: '资源类型必须是字符串' })
  resource?: string

  @IsOptional()
  @IsString({ message: '操作类型必须是字符串' })
  action?: string
}
