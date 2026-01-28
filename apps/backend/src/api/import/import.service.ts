import type { OpenAPIV3 } from 'openapi-types'
import type { Prisma } from 'prisma/generated/client'
import type {
  ImportedApiResult,
  ImportPreviewResDto,
  ImportResultResDto,
  ImportStats,
  OpenApiInfo,
  ParsedApiPreview,
  ParsedGroupPreview,
} from './dto'
import { SystemConfigKey } from '@apiplayer/shared'
import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import * as yaml from 'js-yaml'
import { APIMethod, APIOperationType, VersionChangeType } from 'prisma/generated/client'
import { firstValueFrom } from 'rxjs'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { SystemConfigService } from '@/infra/system-config/system-config.service'
import { ApiUtilsService } from '../utils.service'
import { ConflictStrategy, ExecuteImportReqDto, ParseOpenapiReqDto } from './dto'

/** 默认分组名称 */
const DEFAULT_GROUP_NAME = '未分组'

/** HTTP 方法映射 */
const HTTP_METHODS: Record<string, APIMethod> = {
  get: APIMethod.GET,
  post: APIMethod.POST,
  put: APIMethod.PUT,
  delete: APIMethod.DELETE,
  patch: APIMethod.PATCH,
  head: APIMethod.HEAD,
  options: APIMethod.OPTIONS,
}

/** API 参数结构 */
interface ApiParamData {
  id: string
  name: string
  type: string
  required: boolean
  description: string
  example?: unknown
  defaultValue?: unknown
}

/** API 响应结构 */
interface ApiResponseData {
  id: string
  name: string
  httpStatus: number
  body?: Record<string, unknown>
}

/** 内部使用的 API 数据结构 */
interface InternalApiData {
  name: string
  path: string
  method: APIMethod
  description?: string
  groupName: string
  tags: string[]
  requestHeaders: ApiParamData[]
  pathParams: ApiParamData[]
  queryParams: ApiParamData[]
  requestBody?: Record<string, unknown>
  responses: ApiResponseData[]
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly apiUtilsService: ApiUtilsService,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  /** 解析 OpenAPI 文档并返回预览 */
  async parseOpenapi(
    dto: ParseOpenapiReqDto,
    projectId: string,
    fileContent?: string,
  ): Promise<ImportPreviewResDto> {
    try {
      let content: string

      if (fileContent) {
        content = fileContent
      }
      else if (dto.content) {
        content = dto.content
      }
      else if (dto.url) {
        content = await this.fetchOpenapiFromUrl(dto.url)
      }
      else {
        throw new HanaException('OPENAPI_PARSE_FAILED', { message: '请提供 OpenAPI 文档内容、URL 或上传文件' })
      }

      const doc = this.parseOpenapiContent(content)
      const apis = this.extractApisFromOpenapi(doc)
      const existingApis = await this.getExistingApis(projectId)

      const parsedApis: ParsedApiPreview[] = apis.map((api) => {
        const conflictApi = existingApis.find(
          existing => existing.path === api.path && existing.method === api.method,
        )
        return {
          path: api.path,
          method: api.method,
          name: api.name,
          groupName: api.groupName,
          description: api.description,
          hasConflict: !!conflictApi,
          conflictApiId: conflictApi?.id,
        }
      })

      const groupsMap = new Map<string, ParsedGroupPreview>()
      for (const api of parsedApis) {
        const existing = groupsMap.get(api.groupName)
        if (existing) {
          existing.apiCount++
        }
        else {
          groupsMap.set(api.groupName, {
            name: api.groupName,
            apiCount: 1,
          })
        }
      }

      const stats: ImportStats = {
        totalApis: parsedApis.length,
        newApis: parsedApis.filter(a => !a.hasConflict).length,
        conflictApis: parsedApis.filter(a => a.hasConflict).length,
      }

      const info: OpenApiInfo = {
        title: doc.info?.title || 'Untitled API',
        version: doc.info?.version || '1.0.0',
        description: doc.info?.description,
      }

      this.logger.log(`解析 OpenAPI 文档成功: ${info.title}, 共 ${stats.totalApis} 个 API`)

      return {
        info,
        groups: Array.from(groupsMap.values()),
        apis: parsedApis,
        stats,
        content,
      }
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`解析 OpenAPI 文档失败: ${(error as Error).message}`, (error as Error).stack)
      throw new HanaException('OPENAPI_PARSE_FAILED', { message: (error as Error).message })
    }
  }

  /** 执行导入操作 */
  async executeImport(
    dto: ExecuteImportReqDto,
    projectId: string,
    userId: string,
  ): Promise<ImportResultResDto> {
    try {
      const doc = this.parseOpenapiContent(dto.content)
      const apis = this.extractApisFromOpenapi(doc)
      const existingApis = await this.getExistingApis(projectId)

      // 检查项目 API 数量限制
      const projectMaxApis = this.systemConfigService.get<number>(SystemConfigKey.PROJECT_MAX_APIS)
      const currentApiCount = await this.prisma.aPI.count({
        where: { projectId, recordStatus: 'ACTIVE' },
      })

      const newApisCount = apis.filter((api) => {
        const conflict = existingApis.find(
          existing => existing.path === api.path && existing.method === api.method,
        )
        return !conflict
      }).length

      if (currentApiCount + newApisCount > projectMaxApis) {
        throw new HanaException('PROJECT_API_LIMIT_EXCEEDED')
      }

      const results: ImportedApiResult[] = []
      const createdGroups: string[] = []
      let createdCount = 0
      let updatedCount = 0
      let skippedCount = 0
      let failedCount = 0

      // 获取或创建分组
      const groupNameToId = new Map<string, string>()
      const existingGroups = await this.prisma.aPIGroup.findMany({
        where: { projectId, status: 'ACTIVE' },
        select: { id: true, name: true },
      })
      for (const group of existingGroups) {
        groupNameToId.set(group.name, group.id)
      }

      await this.prisma.$transaction(async (tx) => {
        // 如果需要创建分组
        if (dto.createMissingGroups !== false) {
          const uniqueGroupNames = [...new Set(apis.map(a => a.groupName))]
          for (const groupName of uniqueGroupNames) {
            if (!groupNameToId.has(groupName)) {
              const group = await tx.aPIGroup.create({
                data: {
                  projectId,
                  name: groupName,
                  sortOrder: 0,
                },
              })
              groupNameToId.set(groupName, group.id)
              createdGroups.push(groupName)
            }
          }
        }

        // 处理每个 API
        for (const api of apis) {
          const conflictApi = existingApis.find(
            existing => existing.path === api.path && existing.method === api.method,
          )

          let groupId = dto.targetGroupId || groupNameToId.get(api.groupName)

          if (!groupId) {
            // 如果没有找到分组且不允许创建，使用默认分组
            if (!groupNameToId.has(DEFAULT_GROUP_NAME)) {
              const defaultGroup = await tx.aPIGroup.create({
                data: {
                  projectId,
                  name: DEFAULT_GROUP_NAME,
                  sortOrder: 999,
                },
              })
              groupNameToId.set(DEFAULT_GROUP_NAME, defaultGroup.id)
              createdGroups.push(DEFAULT_GROUP_NAME)
            }
            groupId = groupNameToId.get(DEFAULT_GROUP_NAME)!
          }

          try {
            if (conflictApi) {
              // 处理冲突
              switch (dto.conflictStrategy) {
                case ConflictStrategy.SKIP:
                  results.push({
                    name: api.name,
                    path: api.path,
                    method: api.method,
                    status: 'skipped',
                  })
                  skippedCount++
                  break

                case ConflictStrategy.OVERWRITE:
                  await this.updateExistingApi(tx, conflictApi.id, api, userId)
                  results.push({
                    name: api.name,
                    path: api.path,
                    method: api.method,
                    status: 'updated',
                    apiId: conflictApi.id,
                  })
                  updatedCount++
                  break

                case ConflictStrategy.RENAME: {
                  const renamedApi = await this.createNewApi(
                    tx,
                    { ...api, path: `${api.path}_imported` },
                    groupId,
                    projectId,
                    userId,
                  )
                  results.push({
                    name: api.name,
                    path: `${api.path}_imported`,
                    method: api.method,
                    status: 'created',
                    apiId: renamedApi.id,
                  })
                  createdCount++
                  break
                }
              }
            }
            else {
              // 创建新 API
              const newApi = await this.createNewApi(tx, api, groupId, projectId, userId)
              results.push({
                name: api.name,
                path: api.path,
                method: api.method,
                status: 'created',
                apiId: newApi.id,
              })
              createdCount++
            }
          }
          catch (error) {
            results.push({
              name: api.name,
              path: api.path,
              method: api.method,
              status: 'failed',
              error: (error as Error).message,
            })
            failedCount++
          }
        }
      })

      this.logger.log(
        `用户 ${userId} 在项目 ${projectId} 中导入了 OpenAPI 文档: 创建 ${createdCount}, 更新 ${updatedCount}, 跳过 ${skippedCount}, 失败 ${failedCount}`,
      )

      return {
        success: failedCount === 0,
        results,
        createdCount,
        updatedCount,
        skippedCount,
        failedCount,
        createdGroups,
      }
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`执行导入失败: ${(error as Error).message}`, (error as Error).stack)
      throw new HanaException('OPENAPI_IMPORT_FAILED', { message: (error as Error).message })
    }
  }

  /** 从 URL 获取 OpenAPI 文档 */
  private async fetchOpenapiFromUrl(url: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 30000,
          responseType: 'text',
        }),
      )
      return response.data
    }
    catch (error) {
      throw new HanaException('OPENAPI_FETCH_FAILED', { message: `无法从 URL 获取文档: ${(error as Error).message}` })
    }
  }

  /** 解析 OpenAPI 文档内容 */
  private parseOpenapiContent(content: string): OpenAPIV3.Document {
    try {
      // 尝试解析为 JSON
      const trimmed = content.trim()
      if (trimmed.startsWith('{')) {
        return JSON.parse(content) as OpenAPIV3.Document
      }
      // 尝试解析为 YAML
      return yaml.load(content) as OpenAPIV3.Document
    }
    catch (error) {
      throw new HanaException('OPENAPI_INVALID_FORMAT', { message: `文档格式错误: ${(error as Error).message}` })
    }
  }

  /** 从 OpenAPI 文档中提取 API 列表 */
  private extractApisFromOpenapi(doc: OpenAPIV3.Document): InternalApiData[] {
    const apis: InternalApiData[] = []
    const paths = doc.paths || {}

    for (const [path, pathItem] of Object.entries(paths)) {
      if (!pathItem)
        continue

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!HTTP_METHODS[method] || !operation || typeof operation !== 'object')
          continue

        const op = operation as OpenAPIV3.OperationObject
        const apiMethod = HTTP_METHODS[method]
        const tags = op.tags || [DEFAULT_GROUP_NAME]
        const groupName = tags[0] || DEFAULT_GROUP_NAME

        // 提取参数
        const parameters = op.parameters as OpenAPIV3.ParameterObject[] || []
        const pathParams = parameters
          .filter(p => p.in === 'path')
          .map(p => this.convertParameter(p, doc))
        const queryParams = parameters
          .filter(p => p.in === 'query')
          .map(p => this.convertParameter(p, doc))
        const requestHeaders = parameters
          .filter(p => p.in === 'header')
          .map(p => this.convertParameter(p, doc))

        // 提取请求体
        const requestBody = op.requestBody
          ? this.convertRequestBody(op.requestBody as OpenAPIV3.RequestBodyObject, doc)
          : undefined

        // 提取响应
        const responses = this.convertResponses(op.responses || {}, doc)

        apis.push({
          name: op.summary || op.operationId || `${method.toUpperCase()} ${path}`,
          path,
          method: apiMethod,
          description: op.description,
          groupName,
          tags,
          requestHeaders,
          pathParams,
          queryParams,
          requestBody,
          responses,
        })
      }
    }

    return apis
  }

  /** 转换参数 */
  private convertParameter(
    param: OpenAPIV3.ParameterObject,
    doc: OpenAPIV3.Document,
  ): ApiParamData {
    const schema = param.schema ? this.resolveRef(param.schema, doc) : {}
    return {
      id: crypto.randomUUID(),
      name: param.name,
      type: this.getSchemaType(schema as OpenAPIV3.SchemaObject),
      required: param.required || false,
      description: param.description || '',
      example: param.example,
      defaultValue: (schema as OpenAPIV3.SchemaObject).default,
    }
  }

  /** 转换请求体 */
  private convertRequestBody(
    requestBody: OpenAPIV3.RequestBodyObject,
    doc: OpenAPIV3.Document,
  ): Record<string, unknown> {
    const content = requestBody.content || {}

    // 优先处理 JSON
    if (content['application/json']) {
      const mediaType = content['application/json']
      const schema = mediaType.schema ? this.resolveRef(mediaType.schema, doc) : {}
      return {
        type: 'json',
        jsonSchema: this.convertSchema(schema as OpenAPIV3.SchemaObject, doc),
        description: requestBody.description,
      }
    }

    // 处理 form-data
    if (content['multipart/form-data']) {
      const mediaType = content['multipart/form-data']
      const schema = mediaType.schema ? this.resolveRef(mediaType.schema, doc) : {}
      return {
        type: 'form-data',
        formFields: this.extractFormFields(schema as OpenAPIV3.SchemaObject, doc),
        description: requestBody.description,
      }
    }

    // 处理 x-www-form-urlencoded
    if (content['application/x-www-form-urlencoded']) {
      const mediaType = content['application/x-www-form-urlencoded']
      const schema = mediaType.schema ? this.resolveRef(mediaType.schema, doc) : {}
      return {
        type: 'x-www-form-urlencoded',
        formFields: this.extractFormFields(schema as OpenAPIV3.SchemaObject, doc),
        description: requestBody.description,
      }
    }

    return {
      type: 'none',
      description: requestBody.description,
    }
  }

  /** 转换响应 */
  private convertResponses(
    responses: OpenAPIV3.ResponsesObject,
    doc: OpenAPIV3.Document,
  ): ApiResponseData[] {
    const result: ApiResponseData[] = []

    for (const [statusCode, response] of Object.entries(responses)) {
      if (!response)
        continue

      const httpStatus = statusCode === 'default' ? 200 : Number.parseInt(statusCode, 10)
      const resolvedResponse = this.resolveRef(response, doc) as OpenAPIV3.ResponseObject

      let body: Record<string, unknown> | undefined
      const content = resolvedResponse.content
      if (content?.['application/json']?.schema) {
        const schema = this.resolveRef(content['application/json'].schema, doc)
        body = this.convertSchema(schema as OpenAPIV3.SchemaObject, doc)
      }

      result.push({
        id: crypto.randomUUID(),
        name: resolvedResponse.description || `响应 ${statusCode}`,
        httpStatus,
        body,
      })
    }

    return result
  }

  /** 解析 $ref 引用 */
  private resolveRef<T>(obj: T | OpenAPIV3.ReferenceObject, doc: OpenAPIV3.Document): T {
    if (!obj || typeof obj !== 'object')
      return obj as T

    if ('$ref' in obj) {
      const ref = (obj as OpenAPIV3.ReferenceObject).$ref
      const parts = ref.split('/').slice(1) // Remove leading '#'
      let resolved: unknown = doc
      for (const part of parts) {
        resolved = (resolved as Record<string, unknown>)[part]
      }
      return this.resolveRef(resolved as T, doc)
    }

    return obj as T
  }

  /** 转换 Schema 为内部格式 */
  private convertSchema(
    schema: OpenAPIV3.SchemaObject,
    doc: OpenAPIV3.Document,
  ): Record<string, unknown> {
    if (!schema)
      return {}

    const resolved = this.resolveRef(schema, doc) as OpenAPIV3.SchemaObject

    const result: Record<string, unknown> = {
      type: resolved.type || 'object',
    }

    if (resolved.description)
      result.description = resolved.description
    if (resolved.default !== undefined)
      result.default = resolved.default
    if (resolved.enum)
      result.enum = resolved.enum
    if (resolved.format)
      result.format = resolved.format
    if (resolved.minimum !== undefined)
      result.minimum = resolved.minimum
    if (resolved.maximum !== undefined)
      result.maximum = resolved.maximum
    if (resolved.minLength !== undefined)
      result.minLength = resolved.minLength
    if (resolved.maxLength !== undefined)
      result.maxLength = resolved.maxLength
    if (resolved.pattern)
      result.pattern = resolved.pattern
    if (resolved.example !== undefined)
      result.examples = [resolved.example]

    if (resolved.type === 'object' && resolved.properties) {
      result.properties = {}
      for (const [key, value] of Object.entries(resolved.properties)) {
        (result.properties as Record<string, unknown>)[key] = this.convertSchema(
          value as OpenAPIV3.SchemaObject,
          doc,
        )
      }
      if (resolved.required) {
        result.required = resolved.required
      }
    }

    if (resolved.type === 'array' && resolved.items) {
      result.items = this.convertSchema(resolved.items as OpenAPIV3.SchemaObject, doc)
    }

    return result
  }

  /** 从 Schema 提取表单字段 */
  private extractFormFields(
    schema: OpenAPIV3.SchemaObject,
    doc: OpenAPIV3.Document,
  ): ApiParamData[] {
    const resolved = this.resolveRef(schema, doc) as OpenAPIV3.SchemaObject
    const fields: ApiParamData[] = []

    if (resolved.properties) {
      const required = resolved.required || []
      for (const [name, prop] of Object.entries(resolved.properties)) {
        const propSchema = this.resolveRef(prop, doc) as OpenAPIV3.SchemaObject
        fields.push({
          id: crypto.randomUUID(),
          name,
          type: this.getSchemaType(propSchema),
          required: required.includes(name),
          description: propSchema.description || '',
        })
      }
    }

    return fields
  }

  /** 获取 Schema 类型 */
  private getSchemaType(schema: OpenAPIV3.SchemaObject): string {
    if (!schema)
      return 'string'
    if (schema.type === 'integer')
      return 'integer'
    if (schema.type === 'number')
      return 'number'
    if (schema.type === 'boolean')
      return 'boolean'
    if (schema.type === 'array')
      return 'array'
    if (schema.type === 'object')
      return 'object'
    if (schema.format === 'binary')
      return 'file'
    return 'string'
  }

  /** 获取现有 API 列表 */
  private async getExistingApis(projectId: string) {
    return this.prisma.aPI.findMany({
      where: { projectId, recordStatus: 'ACTIVE' },
      select: { id: true, path: true, method: true },
    })
  }

  /** 创建新 API */
  private async createNewApi(
    tx: Prisma.TransactionClient,
    api: InternalApiData,
    groupId: string,
    projectId: string,
    userId: string,
  ) {
    const newApi = await tx.aPI.create({
      data: {
        projectId,
        groupId,
        name: api.name,
        method: api.method,
        path: api.path,
        tags: api.tags,
        sortOrder: 0,
        editorId: userId,
        creatorId: userId,
      },
    })

    const version = await tx.aPIVersion.create({
      data: {
        apiId: newApi.id,
        projectId,
        revision: 1,
        status: 'DRAFT',
        summary: '从 OpenAPI 文档导入',
        editorId: userId,
        changes: [VersionChangeType.CREATE],
      },
    })

    await tx.aPISnapshot.create({
      data: {
        versionId: version.id,
        name: api.name,
        method: api.method,
        path: api.path,
        description: api.description,
        tags: api.tags,
        status: 'DRAFT',
        sortOrder: 0,
        requestHeaders: api.requestHeaders as unknown as Prisma.InputJsonValue,
        pathParams: api.pathParams as unknown as Prisma.InputJsonValue,
        queryParams: api.queryParams as unknown as Prisma.InputJsonValue,
        requestBody: api.requestBody as Prisma.InputJsonValue,
        responses: api.responses as unknown as Prisma.InputJsonValue,
      },
    })

    await tx.aPI.update({
      where: { id: newApi.id },
      data: { currentVersionId: version.id },
    })

    await this.apiUtilsService.createOperationLog(
      {
        apiId: newApi.id,
        userId,
        operation: APIOperationType.CREATE,
        versionId: version.id,
        changes: [VersionChangeType.CREATE],
        description: '从 OpenAPI 文档导入',
        metadata: { source: 'openapi-import' },
      },
      tx,
    )

    return newApi
  }

  /** 更新现有 API */
  private async updateExistingApi(
    tx: Prisma.TransactionClient,
    apiId: string,
    api: InternalApiData,
    userId: string,
  ) {
    const existingApi = await tx.aPI.findUnique({
      where: { id: apiId },
      include: { currentVersion: true },
    })

    if (!existingApi)
      return

    // 获取当前最大 revision
    const maxRevision = await tx.aPIVersion.aggregate({
      where: { apiId },
      _max: { revision: true },
    })
    const nextRevision = (maxRevision._max.revision ?? 0) + 1

    // 创建新版本
    const version = await tx.aPIVersion.create({
      data: {
        apiId,
        projectId: existingApi.projectId,
        revision: nextRevision,
        status: 'DRAFT',
        summary: '从 OpenAPI 文档更新',
        editorId: userId,
        changes: [VersionChangeType.BASIC_INFO, VersionChangeType.REQUEST_PARAM, VersionChangeType.REQUEST_BODY, VersionChangeType.RESPONSE],
      },
    })

    await tx.aPISnapshot.create({
      data: {
        versionId: version.id,
        name: api.name,
        method: api.method,
        path: api.path,
        description: api.description,
        tags: api.tags,
        status: 'DRAFT',
        sortOrder: existingApi.sortOrder,
        requestHeaders: api.requestHeaders as unknown as Prisma.InputJsonValue,
        pathParams: api.pathParams as unknown as Prisma.InputJsonValue,
        queryParams: api.queryParams as unknown as Prisma.InputJsonValue,
        requestBody: api.requestBody as Prisma.InputJsonValue,
        responses: api.responses as unknown as Prisma.InputJsonValue,
      },
    })

    await tx.aPI.update({
      where: { id: apiId },
      data: {
        name: api.name,
        tags: api.tags,
        editorId: userId,
        currentVersionId: version.id,
      },
    })

    await this.apiUtilsService.createOperationLog(
      {
        apiId,
        userId,
        operation: APIOperationType.UPDATE,
        versionId: version.id,
        changes: [VersionChangeType.BASIC_INFO, VersionChangeType.REQUEST_PARAM, VersionChangeType.REQUEST_BODY, VersionChangeType.RESPONSE],
        description: '从 OpenAPI 文档更新',
        metadata: { source: 'openapi-import' },
      },
      tx,
    )
  }
}
