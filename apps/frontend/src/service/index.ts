import type { Hooks, KyInstance, Options } from 'ky'
import type { IApiResponse } from './types'
import ky from 'ky'
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
        if (parsed.code === 401) {
          console.error('Login expired, please log in again!')
          const userStore = useUserStore()
          userStore.logout()
          // Optional: Redirect to login
          // window.location.href = '/auth/login'
        }

        console.error(parsed.message || 'Business Error')

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
    (error) => {
      const { response } = error
      let message = ''
      if (response) {
        message = `[${response.status}] ${response.statusText}`
      }
      else {
        message = 'Network connection failed, please try again later'
      }

      console.error(message)

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
