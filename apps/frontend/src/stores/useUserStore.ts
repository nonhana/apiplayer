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

  const token = ref('')
  const user = ref<UserDetailInfo | null>(null)
  const isAuthenticated = ref(false)

  function setToken(newToken: string) {
    token.value = newToken
    isAuthenticated.value = !!newToken
  }

  function setUser(newUser: UserDetailInfo | null) {
    user.value = newUser
  }

  // actions
  async function login(values: LoginReq) {
    try {
      const { token, user } = await authApi.login(values)

      // 登录后初始化
      await globalStore.initRoles()
      await teamStore.fetchTeams()

      setToken(token)
      setUser(user)

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

  async function logout() {
    try {
      await authApi.logout()
      token.value = ''
      user.value = null
      isAuthenticated.value = false
      teamStore.reset()
      router.push('/auth/login')
    }
    catch (error) {
      console.error('登出失败', error)
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    setToken,
    setUser,
    login,
    logout,
  }
}, {
  persist: {
    storage: localStorage,
  },
})
