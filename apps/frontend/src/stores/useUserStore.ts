import type { UserBriefInfo, UserDetailInfo, UserFullInfo } from '@/types/user'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api/auth'

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

  function logout() {
    token.value = ''
    user.value = null
    isAuthenticated.value = false
    authApi.logout()
  }

  return {
    token,
    user,
    isAuthenticated,
    setToken,
    setUser,
    logout,
  }
}, {
  persist: {
    storage: localStorage,
  },
})
