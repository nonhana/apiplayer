import { APIMethod, APIStatus } from '@prisma/client'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { ApiBriefDto } from './api.dto'

// 创建分组请求 DTO
export class CreateApiGroupReqDto {
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

// 分组精简信息
@Exclude()
export class GroupBriefDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  parentId?: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  description?: string

  @Expose()
  sortOrder: number

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date
}

// 树节点（不含 API 列表）
@Exclude()
export class GroupTreeNodeDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  sortOrder: number

  @Expose()
  @Type(() => GroupTreeNodeDto)
  children: GroupTreeNodeDto[]

  @Expose()
  @Transform(({ value }) => (value !== undefined ? value : 0), { toPlainOnly: true })
  apiCount: number
}

// API 在分组树中的精简结构
@Exclude()
export class ApiInGroupDto extends ApiBriefDto {
  @Expose()
  tags: string[]

  @Expose()
  updatedAt: Date

  @Expose()
  @Transform(({ obj }) => {
    const snap = obj.currentVersion?.snapshot
    if (!snap)
      return undefined
    return { status: snap.status, summary: snap.summary }
  }, { toClassOnly: true })
  current?: { status: string, summary?: string }
}

// 树节点（含 API 列表）
@Exclude()
export class GroupTreeWithApisNodeDto extends GroupTreeNodeDto {
  @Expose()
  @Type(() => ApiInGroupDto)
  apis: ApiInGroupDto[]
}

// 获取含 API 的分组树 查询参数 DTO
export class GetGroupTreeWithApisReqDto {
  @IsOptional()
  @IsString({ message: '分支根ID必须是字符串' })
  subtreeRootId?: string

  @IsOptional()
  @IsInt({ message: '最大深度必须是整数' })
  @Min(1, { message: '最大深度至少为 1' })
  @Max(32, { message: '最大深度不能超过 32' })
  maxDepth?: number

  @IsOptional()
  includeCurrentVersion?: boolean

  @IsOptional()
  @IsEnum(APIMethod, { message: '方法必须是有效的枚举值' })
  apiMethod?: APIMethod

  @IsOptional()
  @IsEnum(APIStatus, { message: '状态必须是有效的枚举值' })
  apiStatus?: APIStatus

  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string

  @IsOptional()
  @IsInt({ message: '每组 API 限制数量必须是整数' })
  @Min(1, { message: '每组 API 限制数量至少为 1' })
  @Max(1000, { message: '每组 API 限制数量不能超过 1000' })
  apiLimitPerGroup?: number

  @IsOptional()
  @IsString({ message: '排序参数必须是字符串' })
  sort?: 'groups' | 'apis'
}
