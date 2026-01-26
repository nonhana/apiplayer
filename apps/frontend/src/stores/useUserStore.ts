import type { LoginReq } from '@/types/auth'
import type { UserDetailInfo } from '@/types/user'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { authApi } from '@/api/auth'
import { useGlobalStore } from './useGlobalStore'
import { useTeamStore } from './useTeamStore'

export const useUserStore = defineStore('user', () => {
  const teamStore = useTeamStore()
  const globalStore = useGlobalStore()

  const router = useRouter()
  const route = useRoute()

  const user = ref<UserDetailInfo | null>(null)
  const isAuthenticated = ref(false)

  // 标记本次页面会话是否已验证过 Session（普通变量，不会被持久化）
  let isSessionVerified = false

  function setUser(newUser: UserDetailInfo | null) {
    user.value = newUser
  }

  // actions
  async function login(values: LoginReq) {
    try {
      const { user } = await authApi.login(values)

      // 登录后初始化
      await globalStore.initRoles()
      await teamStore.fetchTeams()

      isAuthenticated.value = true
      setUser(user)
      isSessionVerified = true

      toast.success('欢迎回来！', { description: '登录成功，欢迎使用。' })

      // 登录后重定向
      const redirect = route.query.redirect
      if (redirect) {
        router.push(redirect as string)
      }
      else {
        router.push('/dashboard')
      }
    }
    catch (error) {
      console.error('登录失败', error)
    }
  }

  function clearAuth() {
    user.value = null
    isAuthenticated.value = false
    isSessionVerified = false
    teamStore.reset()
  }

  /** 验证当前 Session 是否有效 */
  async function verifySession(): Promise<boolean> {
    // 如果本地没有认证状态，无需验证
    if (!isAuthenticated.value) {
      return false
    }

    // 如果本次页面会话已验证过，直接返回当前状态
    if (isSessionVerified) {
      return isAuthenticated.value
    }

    try {
      // 调用后端验证 Session 并获取最新用户信息
      const userData = await authApi.getCurrentUser()
      setUser(userData)

      // 同时初始化必要的全局数据
      await Promise.all([
        globalStore.initRoles(),
        teamStore.fetchTeams(),
      ])

      isSessionVerified = true
      return true
    }
    catch {
      // Session 无效，清除本地状态
      clearAuth()
      return false
    }
  }

  function getIsSessionVerified() {
    return isSessionVerified
  }

  async function logout() {
    try {
      await authApi.logout()
    }
    catch (error) {
      console.error('登出失败', error)
    }
    finally {
      clearAuth()
      await router.replace('/auth/login')
    }
  }

  return {
    user,
    isAuthenticated,
    setUser,
    login,
    clearAuth,
    logout,
    verifySession,
    getIsSessionVerified,
  }
}, {
  persist: {
    storage: localStorage,
  },
})
