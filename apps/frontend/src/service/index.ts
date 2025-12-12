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

      const resJson = await response.json() as IApiResponse
      const parsed = {
        ...resJson,
        message: Array.isArray(resJson.message) ? resJson.message[0] ?? '' : resJson.message,
      }

      if (parsed.code !== 0 && parsed.code !== 200) {
        if (parsed.code === 401 && parsed.errorCode === 10012) {
          const userStore = useUserStore()
          userStore.logout()
          window.location.href = '/auth/login'
        }
        else {
          toast.error(parsed.message)
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
      else {
        message = '网络异常'
        description = '连接失败，请稍后重试'
      }

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
