import type { ExecuteImportReq, ImportPreview, ImportResult, ParseOpenapiReq } from '@/types/import'
import http from '@/service'

export const importApi = {
  /** 解析 OpenAPI 文档（JSON 方式） */
  parseOpenapi: (projectId: string, data: ParseOpenapiReq) =>
    http.post(`api/${projectId}/import/openapi/parse`, { json: data }).json<ImportPreview>(),

  /** 解析 OpenAPI 文档（文件上传方式） */
  parseOpenapiFile: (projectId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.post(`api/${projectId}/import/openapi/parse`, { body: formData }).json<ImportPreview>()
  },

  /** 执行导入 */
  executeImport: (projectId: string, data: ExecuteImportReq) =>
    http.post(`api/${projectId}/import/openapi/execute`, { json: data }).json<ImportResult>(),
}
