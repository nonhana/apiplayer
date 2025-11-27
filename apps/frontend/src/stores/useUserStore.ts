import type { LoginReq, RegisterReq } from '@/types/auth'
import type { UserBriefInfo, UserDetailInfo, UserFullInfo } from '@/types/user'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api/auth'
import { userApi } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const user = ref<UserBriefInfo | UserDetailInfo | UserFullInfo | null>(null)
  const isAuthenticated = ref(false)

  function setToken(newToken: string) {
    token.value = newToken
    isAuthenticated.value = !!newToken
  }

  function setUser(newUser: UserBriefInfo | UserDetailInfo | UserFullInfo | null) {
    user.value = newUser
  }

  async function login(data: LoginReq) {
    const res = await authApi.login(data)
    setToken(res.token)
    setUser(res.user)
    return res
  }

  async function register(data: RegisterReq) {
    const res = await authApi.register(data)
    // Note: Register usually doesn't return token immediately unless auto-login is implemented.
    // Based on openapi, it returns UserBriefInfoDto.
    // We might need to redirect to login or auto-login if the API supported it.
    return res
  }

  function logout() {
    token.value = ''
    user.value = null
    isAuthenticated.value = false
    authApi.logout().catch(() => {}) // Fire and forget
  }

  async function fetchCurrentUser() {
    if (!token.value)
      return
    try {
      const userInfo = await authApi.getCurrentUser()
      setUser(userInfo)
    }
    catch (error) {
      console.error('Failed to fetch user info', error)
      // invalid token?
      logout()
    }
  }

  async function loadFullProfile() {
    if (!token.value)
      return
    try {
      const profile = await userApi.getProfile()
      setUser(profile)
      return profile
    }
    catch (error) {
      console.error('Failed to load full profile', error)
      // 如果拿不到完整资料，也不强制登出，交给上层处理
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    setToken,
    setUser,
    login,
    register,
    logout,
    fetchCurrentUser,
    loadFullProfile,
  }
}, {
  persist: true,
})
