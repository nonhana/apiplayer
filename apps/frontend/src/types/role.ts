/** 角色类型 */
export type RoleType = 'SYSTEM' | 'PROJECT' | 'TEAM'

/** 角色项 */
export interface RoleItem {
  id: string
  name: string
  description?: string
  type: RoleType
  createdAt: string
  updatedAt: string
}

/** 角色列表响应 */
export interface RolesResponse {
  roles: RoleItem[]
  total: number
}

/** 获取角色列表请求 */
export interface GetRolesReq {
  keyword?: string
  type?: RoleType
}
