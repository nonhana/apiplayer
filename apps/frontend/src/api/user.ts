import type { SearchParamsOption } from 'ky'
import type {
  SearchUsersReq,
  SearchUsersResponse,
  UpdateUserProfileReq,
  UserFullInfo,
} from '@/types/user'
import http from '@/service'

export const userApi = {
  /** 获取当前用户资料 */
  getProfile: () => http.get('user/profile').json<UserFullInfo>(),

  /** 更新用户资料 */
  updateProfile: (data: UpdateUserProfileReq) =>
    http.patch('user/profile', { json: data }).json<UserFullInfo>(),

  /** 发送个人资料修改验证码 */
  sendProfileVerificationCode: () =>
    http.post('user/profile/verification-code').json<void>(),

  /** 搜索用户 */
  searchUsers: (params?: SearchUsersReq) =>
    http.get('user/search', { searchParams: params as SearchParamsOption }).json<SearchUsersResponse>(),
} as const
