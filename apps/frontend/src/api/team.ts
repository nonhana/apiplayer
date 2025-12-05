import type {
  CreateTeamReq,
  InviteTeamMembersReq,
  TeamBrief,
  TeamDetail,
  TeamMember,
  TeamMembersArr,
  TeamMembersResponse,
  TeamsResponse,
  UpdateTeamMemberReq,
  UpdateTeamReq,
} from '@/types/team'
import http from '@/service'

/** 基础分页查询参数 */
interface BasePaginatedQuery {
  page?: number
  limit?: number
  search?: string
}

export const teamApi = {
  /** 创建团队 */
  createTeam: (data: CreateTeamReq) =>
    http.post('teams', { json: data }).json<TeamBrief>(),

  /** 获取用户的团队列表 */
  getTeams: (params?: BasePaginatedQuery) =>
    http.get('teams', { searchParams: params as Record<string, string | number> }).json<TeamsResponse>(),

  /** 获取团队详情 */
  getTeamDetail: (teamId: string) =>
    http.get(`teams/${teamId}`).json<TeamDetail>(),

  /** 更新团队信息 */
  updateTeam: (teamId: string, data: UpdateTeamReq) =>
    http.patch(`teams/${teamId}`, { json: data }).json<TeamBrief>(),

  /** 删除团队 */
  deleteTeam: (teamId: string) =>
    http.delete(`teams/${teamId}`).json<void>(),

  /** 邀请成员加入团队 */
  inviteTeamMembers: (teamId: string, data: InviteTeamMembersReq) =>
    http.post(`team-members/${teamId}/members`, { json: data }).json<TeamMembersArr>(),

  /** 获取团队成员列表 */
  getTeamMembers: (teamId: string, params?: BasePaginatedQuery) =>
    http.get(`team-members/${teamId}/members`, { searchParams: params as Record<string, string | number> }).json<TeamMembersResponse>(),

  /** 更新团队成员角色 */
  updateTeamMember: (teamId: string, memberId: string, data: UpdateTeamMemberReq) =>
    http.patch(`team-members/${teamId}/members/${memberId}`, { json: data }).json<TeamMember>(),

  /** 移除团队成员 */
  removeTeamMember: (teamId: string, memberId: string) =>
    http.delete(`team-members/${teamId}/members/${memberId}`).json<void>(),
}
