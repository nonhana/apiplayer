import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreatePermissionDto {
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
