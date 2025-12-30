import type { ProxyRequest, ProxyResponse } from '@/types/proxy'
import http from '@/service'

export const proxyApi = {
  sendRequest: (data: ProxyRequest) =>
    http.post('proxy/request', {
      json: data,
      timeout: (data.timeout ?? 30000) + 5000,
    }).json<ProxyResponse>(),
}
