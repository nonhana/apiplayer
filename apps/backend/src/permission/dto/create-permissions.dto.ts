import { IsArray, IsNotEmpty } from 'class-validator'
import { CreatePermissionDto } from './create-permission.dto'

export class CreatePermissionsDto {
  @IsArray({ message: '权限列表必须是数组' })
  @IsNotEmpty({ message: '权限列表不能为空' })
  permissions: CreatePermissionDto[]
}
