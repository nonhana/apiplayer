import type { UpdateUserProfileReq, UserFullInfo } from '@/types/user'
import http from '@/service'

export const userApi = {
  getProfile: () => http.get('user/profile').json<UserFullInfo>(),

  updateProfile: (data: UpdateUserProfileReq) =>
    http.patch('user/profile', { json: data }).json<UserFullInfo>(),

  sendProfileVerificationCode: () =>
    http.post('user/profile/verification-code').json<void>(),
}
