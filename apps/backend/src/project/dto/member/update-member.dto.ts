import { IsNotEmpty, IsString } from 'class-validator'

export class UpdateProjectMemberReqDto {
  @IsNotEmpty({ message: '角色 ID 不能为空' })
  @IsString({ message: '角色 ID 必须是字符串' })
  roleId: string
}
