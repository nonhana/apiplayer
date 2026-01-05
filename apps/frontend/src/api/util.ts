import http from '@/service'

export type UploadMode = 'local' | 'r2'

export const utilApi = {
  uploadFile: (file: File, mode?: UploadMode) => {
    const formData = new FormData()
    formData.append('file', file)

    const searchParams = new URLSearchParams()
    if (mode)
      searchParams.set('mode', mode)

    return http.post('util/upload', {
      body: formData,
      searchParams,
    }).json<{ url: string }>()
  },

  getSchemaMock: (schema: Record<string, unknown>) => {
    return http.post('util/schema-mock', {
      json: schema,
    }).json<Record<string, unknown>>()
  },
}
