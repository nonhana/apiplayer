import type {
  AcceptInvitationRes,
  CreateTeamReq,
  InvitationInfo,
  InviteTeamMembersReq,
  SendInvitationReq,
  TeamBrief,
  TeamDetail,
  TeamItem,
  TeamMember,
  TeamMembersResponse,
  TeamsResponse,
  UpdateTeamMemberReq,
  UpdateTeamReq,
  VerifyInvitationRes,
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

  /** 分页获取用户的团队列表 */
  getTeams: (params?: BasePaginatedQuery) =>
    http.get('teams', { searchParams: params as Record<string, string | number> }).json<TeamsResponse>(),

  /** 获取用户的全部团队列表 */
  getAllUserTeams: () =>
    http.get('teams/all').json<TeamItem[]>(),

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
    http.post(`team-members/${teamId}/members`, { json: data }).json<TeamMember[]>(),

  /** 分页获取团队成员列表 */
  getTeamMembers: (teamId: string, params?: BasePaginatedQuery) =>
    http.get(`team-members/${teamId}/members`, { searchParams: params as Record<string, string | number> }).json<TeamMembersResponse>(),

  /** 获取全部团队成员列表 */
  getAllTeamMembers: (teamId: string) =>
    http.get(`team-members/${teamId}/members/all`).json<TeamMember[]>(),

  /** 更新团队成员角色 */
  updateTeamMember: (teamId: string, memberId: string, data: UpdateTeamMemberReq) =>
    http.patch(`team-members/${teamId}/members/${memberId}`, { json: data }).json<TeamMember>(),

  /** 移除团队成员 */
  removeTeamMember: (teamId: string, memberId: string) =>
    http.delete(`team-members/${teamId}/members/${memberId}`).json<void>(),

  /** 发送团队邀请 */
  sendInvitation: (teamId: string, data: SendInvitationReq) =>
    http.post(`team-invitations/${teamId}/invitations`, { json: data }).json<InvitationInfo>(),

  /** 获取团队邀请列表 */
  getTeamInvitations: (teamId: string) =>
    http.get(`team-invitations/${teamId}/invitations`).json<InvitationInfo[]>(),

  /** 撤销邀请 */
  cancelInvitation: (teamId: string, invitationId: string) =>
    http.delete(`team-invitations/${teamId}/invitations/${invitationId}`).json<void>(),

  verifyInvitation: (token: string) =>
    http.get('team-invitations/verify', { searchParams: { token } }).json<VerifyInvitationRes>(),

  /** 接受邀请 */
  acceptInvitation: (token: string) =>
    http.post('team-invitations/accept', { json: { token } }).json<AcceptInvitationRes>(),
}
