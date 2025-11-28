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

/** 用户搜索项 */
export interface UserSearchItem {
  id: string
  email: string
  username: string
  name: string
  avatar?: string
  bio?: string
  isActive: boolean
  createdAt: string
}

/** 用户搜索响应 */
export interface SearchUsersResponse {
  users: UserSearchItem[]
  total: number
  pagination: {
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
