import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator'

/** 创建项目请求 DTO */
export class CreateProjectDto {
  /** 项目名称 */
  @IsNotEmpty({ message: '项目名称不能为空' })
  @IsString({ message: '项目名称必须是字符串' })
  @MinLength(2, { message: '项目名称长度不能少于 2 个字符' })
  @MaxLength(50, { message: '项目名称长度不能超过 50 个字符' })
  name: string

  /** 项目标识符（URL 友好） */
  @IsNotEmpty({ message: '项目标识符不能为空' })
  @IsString({ message: '项目标识符必须是字符串' })
  @MinLength(2, { message: '项目标识符长度不能少于 2 个字符' })
  @MaxLength(30, { message: '项目标识符长度不能超过 30 个字符' })
  slug: string

  /** 项目描述 */
  @IsOptional()
  @IsString({ message: '项目描述必须是字符串' })
  @MaxLength(500, { message: '项目描述长度不能超过 500 个字符' })
  description?: string

  /** 项目图标 */
  @IsOptional()
  @IsUrl({}, { message: '项目图标必须是有效的 URL' })
  icon?: string

  /** 是否公开项目 */
  @IsOptional()
  @IsBoolean({ message: '公开状态必须是布尔值' })
  isPublic?: boolean
}

/** 更新项目请求 DTO */
export class UpdateProjectDto {
  /** 项目名称 */
  @IsOptional()
  @IsString({ message: '项目名称必须是字符串' })
  @MinLength(2, { message: '项目名称长度不能少于 2 个字符' })
  @MaxLength(50, { message: '项目名称长度不能超过 50 个字符' })
  name?: string

  /** 项目描述 */
  @IsOptional()
  @IsString({ message: '项目描述必须是字符串' })
  @MaxLength(500, { message: '项目描述长度不能超过 500 个字符' })
  description?: string

  /** 项目图标 */
  @IsOptional()
  @IsUrl({}, { message: '项目图标必须是有效的 URL' })
  icon?: string

  /** 是否公开项目 */
  @IsOptional()
  @IsBoolean({ message: '公开状态必须是布尔值' })
  isPublic?: boolean
}

/** 项目基本信息 DTO */
export class ProjectInfoDto {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  memberCount: number
  apiCount: number
  currentUserRole?: {
    id: string
    name: string
    description?: string
  }
}

/** 项目详细信息 DTO */
export class ProjectDetailDto {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  memberCount: number
  apiCount: number
  environmentCount: number
  currentUserRole: {
    id: string
    name: string
    description?: string
  }

  team: {
    id: string
    name: string
    slug: string
  }

  recentMembers: Array<{
    id: string
    user: {
      id: string
      username: string
      name: string
      avatar?: string
    }
    role: {
      id: string
      name: string
    }
    joinedAt: Date
  }>

  environments: Array<{
    id: string
    name: string
    type: string
    baseUrl: string
    isDefault: boolean
  }>
}

/** 创建项目响应 DTO */
export class CreateProjectResponseDto {
  message: string
  project: {
    id: string
    name: string
    slug: string
    description?: string
    icon?: string
    isPublic: boolean
    createdAt: Date
  }
}

/** 更新项目响应 DTO */
export class UpdateProjectResponseDto {
  message: string
  project: {
    id: string
    name: string
    slug: string
    description?: string
    icon?: string
    isPublic: boolean
    updatedAt: Date
  }
}

/** 删除项目响应 DTO */
export class DeleteProjectResponseDto {
  message: string
  deletedProjectId: string
}

/** 项目详情响应 DTO */
export class ProjectDetailResponseDto {
  project: ProjectDetailDto
}
