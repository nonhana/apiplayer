import http from '@/service'

export interface UploadFileResult {
  url: string
}

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
    }).json<UploadFileResult>()
  },
}
