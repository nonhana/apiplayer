import type { Hooks, KyInstance, Options } from 'ky'
import type { IApiResponse } from './types'
import ky from 'ky'
import { toast } from 'vue-sonner'
import { useUserStore } from '../stores/useUserStore'
import { HanaError } from './error'

const hooks: Hooks = {
  afterResponse: [
    async (_, __, response) => {
      if (response.status === 204) {
        return response
      }

      // 尝试解析 JSON，优雅处理非 JSON 返回
      let parsed: IApiResponse
      try {
        parsed = (await response.json()) as IApiResponse
      }
      catch {
        // 若解析失败但状态正常，可直接返回 response 或自定义处理
        return response
      }

      if (parsed.code !== 0 && parsed.code !== 200) {
        const message = parsed.message || '业务异常'

        if (parsed.code === 401) {
          console.error('登录已过期，请重新登录！')
          const userStore = useUserStore()
          userStore.logout()
          toast.error(message, {
            description: '请重新登录',
          })
          // 可选：跳转到登录页
          // window.location.href = '/auth/login'
        }
        else {
          console.error(message)
          toast.error(message)
        }

        throw new HanaError(parsed.message, parsed.code)
      }

      const body = JSON.stringify(parsed.data)
      return new Response(body, {
        ...response,
        headers: new Headers(response.headers),
      })
    },
  ],

  beforeError: [
    async (error) => {
      const { response } = error
      let message = ''
      let description = ''

      if (response) {
        message = `请求失败：${response.status}`
        description = response.statusText

        // 若后端有详细错误信息，优先展示
        try {
          const errorData = await response.json() as any
          if (errorData && errorData.message) {
            // message 为数组（例如 class-validator），拼接为字符串
            if (Array.isArray(errorData.message)) {
              description = errorData.message.join(', ')
            }
            else {
              description = errorData.message
            }
          }
        }
        catch {
          // 忽略解析异常
        }
      }
      else {
        message = '网络异常'
        description = '连接失败，请稍后重试'
      }

      console.error(`${message}: ${description}`)
      toast.error(message, {
        description,
      })

      return error
    },
  ],
}

const options: Options = {
  prefixUrl: import.meta.env.DEV ? '/api' : import.meta.env.API_BASE_URL,
  timeout: 10000,
  hooks,
  credentials: 'include',
}

const service: KyInstance = ky.create(options)

export default service
