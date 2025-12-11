import type {
  ApiBrief,
  ApiDetail,
  CloneApiReq,
  CreateApiReq,
  CreateGroupReq,
  DeleteGroupReq,
  GetGroupTreeWithApisReq,
  GroupBrief,
  GroupNodeWithApis,
  MoveApiReq,
  MoveGroupReq,
  SortItemsReq,
  UpdateApiReq,
  UpdateGroupReq,
} from '@/types/api'
import http from '@/service'

/** API 分组相关接口 */
export const groupApi = {
  /** 创建分组 */
  createGroup: (projectId: string, data: CreateGroupReq) =>
    http.post(`api/${projectId}/api-groups`, { json: data }).json<GroupBrief>(),

  /** 获取分组树（含 API 数量统计） */
  getGroupTree: (projectId: string) =>
    http.get(`api/${projectId}/api-groups/tree`).json<GroupNodeWithApis[]>(),

  /** 获取分组树（含 API 列表） */
  getGroupTreeWithApis: (projectId: string, params?: GetGroupTreeWithApisReq) =>
    http.get(`api/${projectId}/api-groups/tree-with-apis`, {
      searchParams: params as Record<string, string | number | boolean>,
    }).json<GroupNodeWithApis[]>(),

  /** 更新分组 */
  updateGroup: (projectId: string, groupId: string, data: UpdateGroupReq) =>
    http.patch(`api/${projectId}/api-groups/${groupId}`, { json: data }).json<GroupBrief>(),

  /** 移动分组 */
  moveGroup: (projectId: string, groupId: string, data: MoveGroupReq) =>
    http.post(`api/${projectId}/api-groups/${groupId}/move`, { json: data }).json<GroupBrief>(),

  /** 删除分组 */
  deleteGroup: (projectId: string, groupId: string, params?: DeleteGroupReq) =>
    http.delete(`api/${projectId}/api-groups/${groupId}`, {
      searchParams: params as Record<string, string | boolean>,
    }).json<void>(),

  /** 批量更新分组排序 */
  sortGroups: (projectId: string, data: SortItemsReq) =>
    http.post(`api/${projectId}/api-groups/sort`, { json: data }).json<void>(),
}

/** API 接口相关接口 */
export const apiApi = {
  /** 创建 API */
  createApi: (projectId: string, data: CreateApiReq) =>
    http.post(`api/${projectId}/apis`, { json: data }).json<ApiBrief>(),

  /** 获取 API 详情 */
  getApiDetail: (projectId: string, apiId: string) =>
    http.get(`api/${projectId}/apis/${apiId}`).json<ApiDetail>(),

  /** 更新 API */
  updateApi: (projectId: string, apiId: string, data: UpdateApiReq) =>
    http.patch(`api/${projectId}/apis/${apiId}`, { json: data }).json<ApiBrief>(),

  /** 删除 API */
  deleteApi: (projectId: string, apiId: string) =>
    http.delete(`api/${projectId}/apis/${apiId}`).json<void>(),

  /** 克隆 API */
  cloneApi: (projectId: string, apiId: string, data: CloneApiReq) =>
    http.post(`api/${projectId}/apis/${apiId}/clone`, { json: data }).json<ApiBrief>(),

  /** 批量更新 API 排序 */
  sortApis: (projectId: string, data: SortItemsReq) =>
    http.post(`api/${projectId}/apis/sort`, { json: data }).json<void>(),

  /** 移动 API 到其他分组 */
  moveApi: (projectId: string, apiId: string, data: MoveApiReq) =>
    http.patch(`api/${projectId}/apis/${apiId}`, {
      json: { baseInfo: { groupId: data.targetGroupId, sortOrder: data.sortOrder } },
    }).json<ApiBrief>(),
}
