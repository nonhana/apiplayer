import { Hooks, KyInstance, Options } from 'ky'
import { IApiResponse } from './types'
import ky from 'ky'
import { HanaError } from './types'

const hooks: Hooks = {
  beforeRequest: [
    (request) => {
      const token = localStorage.getItem('token')
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

      const parsed = (await response.json()) as IApiResponse

      if (parsed.code !== 0 && parsed.code !== 200) {
        if (parsed.code === 401) {
          console.error('Login expired, please log in again!')
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
  prefixUrl: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  hooks,
}

const service: KyInstance = ky.create(options)

export default service
