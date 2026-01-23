import type { UserDetailInfo } from './user'

export interface LoginReq {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginRes {
  token: string
  user: UserDetailInfo
}

export interface RegisterReq {
  email: string
  username: string
  name: string
  password: string
  confirmPassword: string
}

export interface CheckAvailabilityReq {
  email?: string
  username?: string
}

export interface CheckAvailabilityRes {
  available: boolean
  message: string
}

export interface CheckAuthStatusRes {
  isAuthenticated: boolean
}

export interface LogoutAllRes {
  destroyedSessions: number
}
