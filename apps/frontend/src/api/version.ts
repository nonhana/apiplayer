import type {
  ApiVersionComparison,
  ApiVersionDetail,
  ApiVersionsResponse,
  CreateVersionReq,
} from '@/types/version'
import http from '@/service'

/** 版本管理相关接口 */
export const versionApi = {
  /** 获取 API 版本列表 */
  getVersionList: (projectId: string, apiId: string) =>
    http.get(`api/${projectId}/apis/${apiId}/versions`).json<ApiVersionsResponse>(),

  /** 获取版本详情 */
  getVersionDetail: (projectId: string, apiId: string, versionId: string) =>
    http.get(`api/${projectId}/apis/${apiId}/versions/${versionId}`).json<ApiVersionDetail>(),

  /** 创建草稿版本 */
  createDraftVersion: (projectId: string, apiId: string, data: CreateVersionReq) =>
    http.post(`api/${projectId}/apis/${apiId}/versions`, { json: data }).json<ApiVersionDetail>(),

  /** 发布版本 */
  publishVersion: (projectId: string, apiId: string, versionId: string) =>
    http.post(`api/${projectId}/apis/${apiId}/versions/${versionId}/publish`).json<void>(),

  /** 归档版本 */
  archiveVersion: (projectId: string, apiId: string, versionId: string) =>
    http.post(`api/${projectId}/apis/${apiId}/versions/${versionId}/archive`).json<void>(),

  /** 回滚到指定版本 */
  rollbackToVersion: (projectId: string, apiId: string, versionId: string) =>
    http.post(`api/${projectId}/apis/${apiId}/versions/${versionId}/rollback`).json<void>(),

  /** 比较两个版本 */
  compareVersions: (projectId: string, apiId: string, fromVersionId: string, toVersionId: string) =>
    http.get(`api/${projectId}/apis/${apiId}/versions/compare`, {
      searchParams: { from: fromVersionId, to: toVersionId },
    }).json<ApiVersionComparison>(),
}
