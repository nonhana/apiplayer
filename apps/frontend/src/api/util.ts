import http from '@/service'

/** 团队邀请模式 */
export type TeamInviteMode = 'direct' | 'email'

/** 公开配置响应 */
export interface PublicConfig {
  teamInviteMode: TeamInviteMode
}

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

  /** 获取公开配置 */
  getPublicConfig: () => {
    return http.get('util/config/public').json<PublicConfig>()
  },
}
