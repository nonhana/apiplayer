import type { BasePaginatedQuery } from '@/types'
import type {
  CreateProjectReq,
  GetProjectsReq,
  InviteProjectMembersReq,
  ProjectBrief,
  ProjectDetail,
  ProjectMember,
  ProjectMembersArr,
  ProjectMembersResponse,
  ProjectPermissionsResponse,
  ProjectsResponse,
  RecentProjectItem,
  UpdateProjectMemberReq,
  UpdateProjectReq,
} from '@/types/project'
import http from '@/service'

export const projectApi = {
  /** 在团队下创建项目 */
  createProject: (teamId: string, data: CreateProjectReq) =>
    http.post(`projects/${teamId}`, { json: data }).json<ProjectBrief>(),

  /** 获取用户的项目列表 */
  getProjects: (params?: GetProjectsReq) =>
    http.get('projects', { searchParams: params as Record<string, string | number | boolean> }).json<ProjectsResponse>(),

  /** 获取项目详情 */
  getProjectDetail: (projectId: string) =>
    http.get(`projects/${projectId}`).json<ProjectDetail>(),

  /** 更新项目 */
  updateProject: (projectId: string, data: UpdateProjectReq) =>
    http.patch(`projects/${projectId}`, { json: data }).json<ProjectBrief>(),

  /** 删除项目 */
  deleteProject: (projectId: string) =>
    http.delete(`projects/${projectId}`).json<void>(),

  /** 获取最近访问的项目 */
  getRecentProjects: () =>
    http.get('projects/recently/visited').json<RecentProjectItem[]>(),

  /** 获取我的项目角色 */
  getMyProjectRole: (projectId: string) =>
    http.get(`projects/${projectId}/my-role`).json<ProjectPermissionsResponse>(),

  /** 获取项目成员列表 */
  getProjectMembers: (projectId: string, params?: BasePaginatedQuery) =>
    http.get(`projects/${projectId}/members`, { searchParams: params as Record<string, string | number> }).json<ProjectMembersResponse>(),

  /** 邀请项目成员 */
  inviteProjectMembers: (projectId: string, data: InviteProjectMembersReq) =>
    http.post(`projects/${projectId}/members`, { json: data }).json<ProjectMembersArr>(),

  /** 更新项目成员角色 */
  updateProjectMember: (projectId: string, memberId: string, data: UpdateProjectMemberReq) =>
    http.patch(`projects/${projectId}/members/${memberId}`, { json: data }).json<ProjectMember>(),

  /** 移除项目成员 */
  removeProjectMember: (projectId: string, memberId: string) =>
    http.delete(`projects/${projectId}/members/${memberId}`).json<void>(),
}
