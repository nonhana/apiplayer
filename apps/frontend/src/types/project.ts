import type { Pagination, RoleBrief } from './team'
import type { RoleName } from '@/constants/roles'

/** 项目所属团队简要信息 */
export interface ProjectTeam {
  id: string
  name: string
  slug: string
}

/** 项目简要信息 */
export interface ProjectBrief {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  isPublic: boolean
  createdAt: string
}

/** 项目列表项 */
export interface ProjectItem extends ProjectBrief {
  updatedAt: string
  memberCount: number
  apiCount: number
  team: ProjectTeam
  currentUserRole?: RoleBrief
}

/** 项目成员用户信息 */
export interface ProjectMemberInfo {
  id: string
  name: string
  email: string
  username: string
  avatar?: string
}

/** 项目成员角色 */
export interface ProjectMemberRole {
  id: string
  name: RoleName
}

/** 项目成员 */
export interface ProjectMember {
  id: string
  user: ProjectMemberInfo
  role: ProjectMemberRole
  joinedAt: string
}

/** 项目成员数组 */
export interface ProjectMembersArr {
  members: ProjectMember[]
}

/** 项目环境 */
export interface ProjectEnv {
  id: string
  name: string
  type: 'DEV' | 'TEST' | 'STAGING' | 'PROD'
  baseUrl: string
  variables?: Record<string, string>
  isDefault: boolean
  createdAt: string
}

/** 项目详情 */
export interface ProjectDetail extends ProjectItem {
  recentMembers: ProjectMember[]
  environmentCount: number
  environments: ProjectEnv[]
}

/** 项目列表响应 */
export interface ProjectsResponse {
  projects: ProjectItem[]
  total: number
  pagination: Pagination
}

/** 最近访问项目项 */
export interface RecentProjectItem {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  isPublic: boolean
  team: ProjectTeam
  lastVisitedAt: string
}

/** 创建项目请求 */
export interface CreateProjectReq {
  name: string
  slug: string
  description?: string
  icon?: string
  isPublic?: boolean
}

/** 更新项目请求 */
export interface UpdateProjectReq {
  name?: string
  description?: string
  icon?: string
  isPublic?: boolean
}

/** 获取项目列表请求 */
export interface GetProjectsReq {
  page?: number
  limit?: number
  search?: string
  teamId?: string
  isPublic?: boolean
}

/** 项目角色权限响应 */
export interface ProjectPermissionsResponse {
  role: RoleBrief
  permissions: string[]
}

/** 项目成员列表响应 */
export interface ProjectMembersResponse {
  members: ProjectMember[]
  total: number
  pagination: Pagination
}

/** 邀请项目成员 Item */
export interface InviteProjectMemberItem {
  email: string
  roleId: string
}

/** 邀请项目成员请求 */
export interface InviteProjectMembersReq {
  members: InviteProjectMemberItem[]
}

/** 更新项目成员请求 */
export interface UpdateProjectMemberReq {
  roleId: string
}

/** 项目环境类型 */
export type ProjectEnvType = 'DEV' | 'TEST' | 'STAGING' | 'PROD'

/** 创建项目环境请求 */
export interface CreateProjectEnvReq {
  name: string
  type: ProjectEnvType
  baseUrl: string
  variables?: Record<string, string>
  headers?: Record<string, string>
  isDefault?: boolean
}

/** 更新项目环境请求 */
export type UpdateProjectEnvReq = Partial<CreateProjectEnvReq>
