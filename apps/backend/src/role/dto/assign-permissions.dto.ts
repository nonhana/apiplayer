import { IsArray, IsString } from 'class-validator'

export class AssignPermissionsReqDto {
  @IsArray({ message: '权限列表必须是数组' })
  @IsString({ each: true, message: '权限ID必须是字符串' })
  permissionIds: string[]
}
