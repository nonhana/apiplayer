import type { RoleName } from '@/constants/roles'

/** 团队简要信息 */
export interface TeamBrief {
  id: string
  name: string
  slug: string
  description?: string
  avatar?: string
  createdAt: string
}

/** 角色简要信息 */
export interface RoleBrief {
  id: string
  name: RoleName
  description?: string
}

/** 团队列表项 */
export interface TeamItem extends TeamBrief {
  isActive: boolean
  updatedAt: string
  memberCount: number
  projectCount: number
  currentUserRole?: RoleBrief
}

/** 成员用户信息 */
export interface MemberInfo {
  id: string
  name: string
  email: string
  username: string
  avatar?: string
}

/** 成员角色信息 */
export interface MemberRole {
  id: string
  name: string
}

/** 团队成员 */
export interface TeamMember {
  id: string
  user: MemberInfo
  role: MemberRole
  nickname?: string
  joinedAt: string
}

/** 团队关联的项目简要信息 */
export interface TeamProject {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  isPublic: boolean
  createdAt: string
}

/** 团队详情 */
export interface TeamDetail extends TeamItem {
  recentMembers: TeamMember[]
  recentProjects: TeamProject[]
}

/** 分页信息 */
export interface Pagination {
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/** 团队列表响应 */
export interface TeamsResponse {
  teams: TeamItem[]
  total: number
  pagination: Pagination
}

/** 团队成员列表响应 */
export interface TeamMembersResponse {
  members: TeamMember[]
  total: number
  pagination: Pagination
}

/** 创建团队请求 */
export interface CreateTeamReq {
  name: string
  slug: string
  description?: string
  avatar?: string
}

/** 更新团队请求 */
export interface UpdateTeamReq {
  name?: string
  description?: string
  avatar?: string
}

/** 邀请团队成员请求 */
export interface InviteTeamMemberReq {
  email: string
  roleId: string
  nickname?: string
}

/** 更新团队成员请求 */
export interface UpdateTeamMemberReq {
  roleId: string
  nickname?: string
}
