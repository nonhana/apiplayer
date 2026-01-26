import type { Hooks, KyInstance, Options } from 'ky'
import type { IApiResponse } from './types'
import { getErrorCode } from '@apiplayer/shared'
import { StatusCodes } from 'http-status-codes'
import ky from 'ky'
import { toast } from 'vue-sonner'
import router from '@/router'
import { useUserStore } from '@/stores/useUserStore'
import { HanaError } from './error'

let isReLogin = false

const hooks: Hooks = {
  afterResponse: [
    async (_, __, response) => {
      // 204 No Content 直接放行
      if (response.status === StatusCodes.NO_CONTENT) {
        return response
      }

      // 克隆响应避免 body lock
      const responseClone = response.clone()

      let resJson: IApiResponse
      try {
        resJson = await responseClone.json()
      }
      catch {
        // 如果不是 JSON，说明存在一些外界副作用，直接返回原响应
        return response
      }

      // 处理 message 为数组的情况（class-validator）
      const message = Array.isArray(resJson.message)
        ? resJson.message[0] ?? '未知错误'
        : resJson.message

      if (resJson.status !== StatusCodes.OK) {
        if (
          resJson.status === StatusCodes.UNAUTHORIZED
          && resJson.code === getErrorCode('SESSION_EXPIRED')
        ) {
          if (!isReLogin) {
            toast.error('登录已过期，请重新登录')
            isReLogin = true
            const userStore = useUserStore()
            userStore.clearAuth()
            await router.push({
              name: 'Login',
              query: { redirect: router.currentRoute.value.fullPath },
            })
            setTimeout(() => isReLogin = false, 1000)
          }
          throw new HanaError(message, resJson.status)
        }

        toast.error(message)
        throw new HanaError(message, resJson.status)
      }

      return new Response(JSON.stringify(resJson.data), response)
    },
  ],

  beforeError: [
    async (error) => {
      const { response } = error
      let message = '网络异常'
      let description = '连接失败，请稍后重试'

      if (response) {
        message = `请求失败：${response.status}`
        description = response.statusText

        try {
          const errorResponse = await response.clone().json()
          if (errorResponse) {
            if (errorResponse.message) {
              description = Array.isArray(errorResponse.message)
                ? errorResponse.message.join(', ')
                : errorResponse.message
            }
          }
        }
        catch {}
      }
      else if (error.request) {
        if (error.name === 'TimeoutError') {
          message = '请求超时'
          description = '服务器响应时间过长'
        }
      }

      if (response?.status !== 401) {
        toast.error(message, { description })
      }

      return error
    },
  ],
}

const options: Options = {
  prefixUrl: import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  hooks,
  retry: {
    limit: 1,
    methods: ['get'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
  // 跨域请求时携带 Cookie
  credentials: 'include',
}

const service: KyInstance = ky.create(options)

export default service
