import type {
  CheckAuthStatusRes,
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  LoginReq,
  LoginRes,
  LogoutAllRes,
  RegisterReq,
} from '@/types/auth'
import type { UserBriefInfo, UserDetailInfo, UserSession } from '@/types/user'
import http from '@/service'

export const authApi = {
  login: (data: LoginReq) => http.post('auth/login', { json: data }).json<LoginRes>(),

  register: (data: RegisterReq) => http.post('auth/register', { json: data }).json<UserBriefInfo>(),

  checkAvailability: (data: CheckAvailabilityReq) => http.post('auth/check-availability', { json: data }).json<CheckAvailabilityRes>(),

  logout: () => http.post('auth/logout').json(),

  logoutAll: () => http.post('auth/logout-all').json<LogoutAllRes>(),

  getCurrentUser: () => http.get('auth/me').json<UserDetailInfo>(),

  getSessions: () => http.get('auth/sessions').json<UserSession[]>(),

  destroySession: (sessionId: string) => http.delete(`auth/sessions/${sessionId}`).json(),

  checkAuthStatus: () => http.get('auth/check').json<CheckAuthStatusRes>(),
}
