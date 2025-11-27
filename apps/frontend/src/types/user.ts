export interface UserBriefInfo {
  id: string
  email: string
  username: string
  name: string
  avatar?: string
}

export interface UserDetailInfo extends UserBriefInfo {
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

export interface UserFullInfo extends UserDetailInfo {
  bio?: string
  updatedAt: string
}

export interface UpdateUserProfileReq {
  name?: string
  username?: string
  avatar?: string
  bio?: string
  newEmail?: string
  newPassword?: string
  confirmNewPassword?: string
  verificationCode?: string
}

export interface UserSession {
  sessionId: string
  createdAt: string
  lastAccessed: string
  userAgent?: string
  ipAddress?: string
  isCurrent: boolean
}
