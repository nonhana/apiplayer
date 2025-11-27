import type {
  CreateProjectReq,
  GetProjectsReq,
  ProjectBrief,
  ProjectDetail,
  ProjectPermissionsResponse,
  ProjectsResponse,
  RecentProjectItem,
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
}
