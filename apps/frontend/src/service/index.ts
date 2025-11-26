import type { Hooks, KyInstance, Options } from 'ky'
import type { IApiResponse } from './types'
import ky from 'ky'
import { toast } from 'vue-sonner'
import { useUserStore } from '../stores/useUserStore'
import { HanaError } from './error'

const hooks: Hooks = {
  beforeRequest: [
    (request) => {
      // Access store inside the hook to ensure Pinia is initialized
      const userStore = useUserStore()
      const token = userStore.token

      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`)
      }
    },
  ],

  afterResponse: [
    async (_, __, response) => {
      if (response.status === 204) {
        return response
      }

      // Try-catch for JSON parsing to handle non-JSON responses gracefully
      let parsed: IApiResponse
      try {
        parsed = (await response.json()) as IApiResponse
      }
      catch {
        // If parsing fails but status is OK, we might return the response as is or handle it
        return response
      }

      if (parsed.code !== 0 && parsed.code !== 200) {
        const message = parsed.message || 'Business Error'

        if (parsed.code === 401) {
          console.error('Login expired, please log in again!')
          const userStore = useUserStore()
          userStore.logout()
          toast.error(message, {
            description: 'Please login again',
          })
          // Optional: Redirect to login
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
        message = `Request Failed: ${response.status}`
        description = response.statusText

        // Try to parse error message from backend if available
        try {
          const errorData = await response.json() as any
          if (errorData && errorData.message) {
            // If message is array (class-validator), join it
            if (Array.isArray(errorData.message)) {
              description = errorData.message.join(', ')
            }
            else {
              description = errorData.message
            }
          }
        }
        catch {
          // Ignore parsing error
        }
      }
      else {
        message = 'Network Error'
        description = 'Connection failed, please try again later'
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
  prefixUrl: import.meta.env.VITE_API_BASE_URL || '/api', // Fallback to /api proxy
  timeout: 10000,
  hooks,
}

const service: KyInstance = ky.create(options)

export default service
