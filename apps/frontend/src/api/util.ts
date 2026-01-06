import http from '@/service'

export const utilApi = {
  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const searchParams = new URLSearchParams()

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
