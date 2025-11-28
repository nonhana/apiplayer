import type { GetRolesReq, RolesResponse } from '@/types/role'
import http from '@/service'

export const roleApi = {
  /** 获取角色列表 */
  getRoles: (params?: GetRolesReq) =>
    http.get('roles', { searchParams: params as Record<string, string> }).json<RolesResponse>(),
}
