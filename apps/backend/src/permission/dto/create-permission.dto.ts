import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreatePermissionReqDto {
  @IsString({ message: '权限名称必须是字符串' })
  @IsNotEmpty({ message: '权限名称不能为空' })
  name: string

  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  description?: string

  @IsString({ message: '资源类型必须是字符串' })
  @IsNotEmpty({ message: '资源类型不能为空' })
  resource: string

  @IsString({ message: '操作类型必须是字符串' })
  @IsNotEmpty({ message: '操作类型不能为空' })
  action: string
}

export class CreatePermissionsReqDto {
  @IsArray({ message: '权限列表必须是数组' })
  @IsNotEmpty({ message: '权限列表不能为空' })
  permissions: CreatePermissionReqDto[]
}
