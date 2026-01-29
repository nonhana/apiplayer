import type { OpenAPIV3 } from 'openapi-types'
import type { InputJsonValue, TransactionClient } from 'prisma/generated/internal/prismaNamespace'
import { Buffer } from 'node:buffer'
import { SystemConfigKey } from '@apiplayer/shared'
import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import * as yaml from 'js-yaml'
import { nanoid } from 'nanoid'
import { APIMethod, APIOperationType, VersionChangeType } from 'prisma/generated/client'
import { firstValueFrom } from 'rxjs'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { SystemConfigService } from '@/infra/system-config/system-config.service'
import {
  ConflictStrategy,
  ExecuteImportReqDto,
  ImportedApiResult,
  ImportPreviewResDto,
  ImportResultResDto,
  ImportStats,
  OpenApiInfo,
  ParsedApiPreview,
  ParsedGroupPreview,
  ParseOpenapiReqDto,
} from './dto'
import { ApiUtilsService } from './utils.service'

/** 默认分组名称 */
const DEFAULT_GROUP_NAME = '未分组'

/** Schema 转换的最大深度，防止循环引用导致栈溢出 */
const MAX_SCHEMA_DEPTH = 10

/** 引用链最大深度 */
const MAX_REF_CHAIN_DEPTH = 20

/** HTTP 请求超时时间 (ms) */
const HTTP_FETCH_TIMEOUT = 30000

/** OpenAPI 文档最大大小 (10MB) */
const MAX_CONTENT_SIZE = 10 * 1024 * 1024

/** HTTP 方法映射 */
const HTTP_METHOD_MAP: Readonly<Record<string, APIMethod>> = {
  get: APIMethod.GET,
  post: APIMethod.POST,
  put: APIMethod.PUT,
  delete: APIMethod.DELETE,
  patch: APIMethod.PATCH,
  head: APIMethod.HEAD,
  options: APIMethod.OPTIONS,
}

/** 支持的 HTTP 方法集合（用于快速查找） */
const SUPPORTED_HTTP_METHODS = new Set(Object.keys(HTTP_METHOD_MAP))

/** JSON 请求体 Content-Type */
const CONTENT_TYPE_JSON = 'application/json'

/** Form-Data Content-Type */
const CONTENT_TYPE_FORM_DATA = 'multipart/form-data'

/** URL Encoded Content-Type */
const CONTENT_TYPE_URL_ENCODED = 'application/x-www-form-urlencoded'

/** XML Content-Type */
const CONTENT_TYPE_XML = 'application/xml'

/** 纯文本 Content-Type */
const CONTENT_TYPE_TEXT = 'text/plain'

/** 二进制 Content-Type */
const CONTENT_TYPE_OCTET_STREAM = 'application/octet-stream'

// ============================================================================
// 类型定义
// ============================================================================

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

/** 请求体数据结构 */
interface RequestBodyData {
  type: 'json' | 'form-data' | 'x-www-form-urlencoded' | 'xml' | 'text' | 'binary' | 'none'
  jsonSchema?: Record<string, unknown>
  formFields?: ApiParamData[]
  rawContent?: string
  description?: string
}

/** 内部使用的 API 数据结构 */
interface InternalApiData {
  name: string
  path: string
  method: APIMethod
  operationId?: string
  description?: string
  groupName: string
  tags: string[]
  requestHeaders: ApiParamData[]
  pathParams: ApiParamData[]
  queryParams: ApiParamData[]
  requestBody?: RequestBodyData
  responses: ApiResponseData[]
}

/** 服务器信息 */
interface ServerInfo {
  url: string
  description?: string
}

/** 解析结果内部结构 */
interface ParseResult {
  info: OpenApiInfo
  servers: ServerInfo[]
  apis: InternalApiData[]
  operationIds: Set<string>
}

/** 冲突 API 信息 */
interface ConflictApiInfo {
  id: string
  path: string
  method: APIMethod
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 生成 API 唯一标识键
 * @param method HTTP 方法
 * @param path 请求路径
 */
function buildApiKey(method: APIMethod | string, path: string): string {
  return `${method}:${path}`
}

/**
 * 将任意值转换为 Prisma JSON 值
 * @param value 待转换的值
 */
function toJsonValue<T>(value: T): InputJsonValue {
  return value as unknown as InputJsonValue
}

/**
 * 检查对象是否为 OpenAPI 引用对象
 * @param obj 待检查的对象
 */
function isReferenceObject(obj: unknown): obj is OpenAPIV3.ReferenceObject {
  return obj !== null && typeof obj === 'object' && '$ref' in obj
}

/**
 * 获取引用路径
 * @param ref 引用对象
 */
function getRefPath(ref: OpenAPIV3.ReferenceObject): string {
  return ref.$ref
}

// ============================================================================
// ImportService
// ============================================================================

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly apiUtilsService: ApiUtilsService,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  // ==========================================================================
  // 公开 API
  // ==========================================================================

  /**
   * 解析 OpenAPI 文档并返回预览
   * @param dto 解析请求参数
   * @param projectId 项目 ID
   * @param fileContent 上传的文件内容（可选）
   */
  async parseOpenapi(
    dto: ParseOpenapiReqDto,
    projectId: string,
    fileContent?: string,
  ): Promise<ImportPreviewResDto> {
    try {
      // 获取文档内容
      const content = await this.resolveOpenapiContent(dto, fileContent)

      // 解析文档
      const doc = this.parseOpenapiDocument(content)

      // 提取 API 信息
      const parseResult = this.extractApisFromDocument(doc)

      // 获取现有 API 并构建查找 Map
      const existingApis = await this.getExistingApis(projectId)
      const existingApiMap = this.buildExistingApiMap(existingApis)

      // 构建预览数据
      const { parsedApis, groupsMap } = this.buildPreviewData(parseResult.apis, existingApiMap)

      // 构建统计信息
      const stats = this.buildImportStats(parsedApis)

      this.logger.log(
        `解析 OpenAPI 文档成功: ${parseResult.info.title}, 共 ${stats.totalApis} 个 API, ${stats.newApis} 个新增, ${stats.conflictApis} 个冲突`,
      )

      return {
        info: parseResult.info,
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

  /**
   * 执行导入操作
   * @param dto 导入请求参数
   * @param projectId 项目 ID
   * @param userId 用户 ID
   */
  async executeImport(
    dto: ExecuteImportReqDto,
    projectId: string,
    userId: string,
  ): Promise<ImportResultResDto> {
    try {
      // 解析文档
      const doc = this.parseOpenapiDocument(dto.content)
      const parseResult = this.extractApisFromDocument(doc)

      // 获取现有 API 并构建查找 Map
      const existingApis = await this.getExistingApis(projectId)
      const existingApiMap = this.buildExistingApiMap(existingApis)

      // 检查项目 API 数量限制
      await this.validateApiLimit(projectId, parseResult.apis, existingApiMap, dto.conflictStrategy)

      // 执行导入
      return await this.performImport(dto, projectId, userId, parseResult.apis, existingApiMap)
    }
    catch (error) {
      if (error instanceof HanaException)
        throw error
      this.logger.error(`执行导入失败: ${(error as Error).message}`, (error as Error).stack)
      throw new HanaException('OPENAPI_IMPORT_FAILED', { message: (error as Error).message })
    }
  }

  // ==========================================================================
  // 内容获取与解析
  // ==========================================================================

  /**
   * 解析获取 OpenAPI 文档内容
   * @param dto 请求参数
   * @param fileContent 上传的文件内容
   */
  private async resolveOpenapiContent(dto: ParseOpenapiReqDto, fileContent?: string): Promise<string> {
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
      throw new HanaException('OPENAPI_PARSE_FAILED', {
        message: '请提供 OpenAPI 文档内容、URL 或上传文件',
      })
    }

    // 验证内容大小
    this.validateContentSize(content)
    return content
  }

  /**
   * 验证内容大小
   * @param content 文档内容
   */
  private validateContentSize(content: string): void {
    const sizeInBytes = Buffer.byteLength(content, 'utf-8')
    if (sizeInBytes > MAX_CONTENT_SIZE) {
      const sizeMB = (sizeInBytes / (1024 * 1024)).toFixed(2)
      throw new HanaException('OPENAPI_PARSE_FAILED', {
        message: `文档大小 (${sizeMB}MB) 超过限制 (10MB)`,
      })
    }
  }

  /**
   * 从 URL 获取 OpenAPI 文档
   * @param url 文档 URL
   */
  private async fetchOpenapiFromUrl(url: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: HTTP_FETCH_TIMEOUT,
          responseType: 'text',
          maxContentLength: MAX_CONTENT_SIZE,
          maxBodyLength: MAX_CONTENT_SIZE,
        }),
      )
      return response.data
    }
    catch (error) {
      throw new HanaException('OPENAPI_FETCH_FAILED', {
        message: `无法从 URL 获取文档: ${(error as Error).message}`,
      })
    }
  }

  /**
   * 解析 OpenAPI 文档内容（支持 JSON/YAML）
   * @param content 文档内容字符串
   */
  private parseOpenapiDocument(content: string): OpenAPIV3.Document {
    try {
      const trimmed = content.trim()

      // JSON 格式检测（以 { 开头）
      if (trimmed.startsWith('{')) {
        return JSON.parse(content) as OpenAPIV3.Document
      }

      // YAML 格式
      return yaml.load(content, { schema: yaml.JSON_SCHEMA }) as OpenAPIV3.Document
    }
    catch (error) {
      throw new HanaException('OPENAPI_INVALID_FORMAT', {
        message: `文档格式错误: ${(error as Error).message}`,
      })
    }
  }

  // ==========================================================================
  // API 提取
  // ==========================================================================

  /**
   * 从 OpenAPI 文档中提取 API 信息
   * @param doc OpenAPI 文档对象
   */
  private extractApisFromDocument(doc: OpenAPIV3.Document): ParseResult {
    const apis: InternalApiData[] = []
    const operationIds = new Set<string>()
    const paths = doc.paths || {}

    for (const [path, pathItem] of Object.entries(paths)) {
      if (!pathItem)
        continue

      // 提取 path 级别的公共参数
      const pathLevelParams = this.resolveParameters(
        (pathItem as OpenAPIV3.PathItemObject).parameters,
        doc,
      )

      for (const [method, operation] of Object.entries(pathItem)) {
        // 跳过非 HTTP 方法字段（如 parameters, summary 等）
        if (!SUPPORTED_HTTP_METHODS.has(method))
          continue

        if (!operation || typeof operation !== 'object')
          continue

        const op = operation as OpenAPIV3.OperationObject
        const apiData = this.extractSingleApi(path, method, op, pathLevelParams, doc, operationIds)
        apis.push(apiData)
      }
    }

    // 提取文档基本信息
    const info: OpenApiInfo = {
      title: doc.info?.title || 'Untitled API',
      version: doc.info?.version || '1.0.0',
      description: doc.info?.description,
    }

    // 提取服务器信息
    const servers: ServerInfo[] = (doc.servers || []).map(server => ({
      url: server.url,
      description: server.description,
    }))

    return { info, servers, apis, operationIds }
  }

  /**
   * 提取单个 API 信息
   * @param path 请求路径
   * @param method HTTP 方法
   * @param operation 操作对象
   * @param pathLevelParams 路径级别参数
   * @param doc OpenAPI 文档
   * @param operationIds 已使用的 operationId 集合
   */
  private extractSingleApi(
    path: string,
    method: string,
    operation: OpenAPIV3.OperationObject,
    pathLevelParams: OpenAPIV3.ParameterObject[],
    doc: OpenAPIV3.Document,
    operationIds: Set<string>,
  ): InternalApiData {
    const apiMethod = HTTP_METHOD_MAP[method]

    // 处理 tags，确保非空
    const tags = this.normalizeTags(operation.tags)
    const groupName = tags[0]

    // 合并 path 级别和 operation 级别的参数
    const operationParams = this.resolveParameters(operation.parameters, doc)
    const mergedParams = this.mergeParameters(pathLevelParams, operationParams)

    // 按参数位置分类
    const pathParams = mergedParams.filter(p => p.in === 'path').map(p => this.convertParameter(p, doc))
    const queryParams = mergedParams.filter(p => p.in === 'query').map(p => this.convertParameter(p, doc))
    const requestHeaders = mergedParams.filter(p => p.in === 'header').map(p => this.convertParameter(p, doc))

    // 提取请求体
    const requestBody = operation.requestBody
      ? this.convertRequestBody(operation.requestBody, doc)
      : undefined

    // 提取响应
    const responses = this.convertResponses(operation.responses || {}, doc)

    // 处理 operationId
    const operationId = operation.operationId
    if (operationId) {
      if (operationIds.has(operationId)) {
        this.logger.warn(`重复的 operationId: ${operationId}，路径: ${method.toUpperCase()} ${path}`)
      }
      else {
        operationIds.add(operationId)
      }
    }

    return {
      name: operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`,
      path,
      method: apiMethod,
      operationId,
      description: operation.description,
      groupName,
      tags,
      requestHeaders,
      pathParams,
      queryParams,
      requestBody,
      responses,
    }
  }

  /**
   * 规范化 tags 数组
   * @param tags 原始 tags
   */
  private normalizeTags(tags?: string[]): string[] {
    // 过滤空字符串和 undefined
    const validTags = tags?.filter(tag => tag?.trim())

    if (!validTags || validTags.length === 0) {
      return [DEFAULT_GROUP_NAME]
    }

    return validTags
  }

  /**
   * 解析参数数组（处理 $ref 引用）
   * @param parameters 参数数组
   * @param doc OpenAPI 文档
   */
  private resolveParameters(
    parameters: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[] | undefined,
    doc: OpenAPIV3.Document,
  ): OpenAPIV3.ParameterObject[] {
    if (!parameters)
      return []

    return parameters
      .map(param => this.resolveRef(param, doc))
      .filter((param): param is OpenAPIV3.ParameterObject => param !== null && typeof param === 'object')
  }

  /**
   * 合并路径级别和操作级别的参数
   * 操作级别参数会覆盖同名的路径级别参数
   * @param pathParams 路径级别参数
   * @param operationParams 操作级别参数
   */
  private mergeParameters(
    pathParams: OpenAPIV3.ParameterObject[],
    operationParams: OpenAPIV3.ParameterObject[],
  ): OpenAPIV3.ParameterObject[] {
    const paramMap = new Map<string, OpenAPIV3.ParameterObject>()

    // 先添加 path 级别参数
    for (const param of pathParams) {
      const key = `${param.in}:${param.name}`
      paramMap.set(key, param)
    }

    // 操作级别参数覆盖同名参数
    for (const param of operationParams) {
      const key = `${param.in}:${param.name}`
      paramMap.set(key, param)
    }

    return Array.from(paramMap.values())
  }

  // ==========================================================================
  // $ref 引用解析
  // ==========================================================================

  /**
   * 解析 $ref 引用
   * @param obj 待解析的对象
   * @param doc OpenAPI 文档
   */
  private resolveRef<T>(obj: T | OpenAPIV3.ReferenceObject, doc: OpenAPIV3.Document): T {
    if (!obj || typeof obj !== 'object')
      return obj as T

    if (!isReferenceObject(obj))
      return obj as T

    let resolved: unknown = this.resolveRefPath(getRefPath(obj), doc)
    let depth = 0

    // 处理引用链
    while (resolved && isReferenceObject(resolved)) {
      if (depth++ > MAX_REF_CHAIN_DEPTH) {
        this.logger.warn(`引用链过深，停止解析: ${getRefPath(obj)}`)
        return {} as T
      }
      resolved = this.resolveRefPath(getRefPath(resolved), doc)
    }

    return resolved as T
  }

  /**
   * 根据引用路径解析对象
   * @param refPath 引用路径（如 #/components/schemas/Pet）
   * @param doc OpenAPI 文档
   */
  private resolveRefPath(refPath: string, doc: OpenAPIV3.Document): unknown {
    const parts = refPath.split('/').slice(1) // 移除开头的 '#'
    let resolved: unknown = doc

    for (const part of parts) {
      resolved = (resolved as Record<string, unknown>)?.[part]
      if (resolved === undefined) {
        this.logger.warn(`无法解析引用: ${refPath}`)
        return {}
      }
    }

    return resolved
  }

  // ==========================================================================
  // 参数转换
  // ==========================================================================

  /**
   * 转换参数为内部格式
   * @param param OpenAPI 参数对象
   * @param doc OpenAPI 文档
   */
  private convertParameter(param: OpenAPIV3.ParameterObject, doc: OpenAPIV3.Document): ApiParamData {
    const schema = param.schema ? this.resolveRef(param.schema, doc) : {}
    const schemaObj = schema as OpenAPIV3.SchemaObject

    return {
      id: nanoid(),
      name: param.name,
      type: this.getSchemaType(schemaObj),
      required: param.required || false,
      description: param.description || '',
      example: param.example ?? schemaObj?.example,
      defaultValue: schemaObj?.default,
    }
  }

  // ==========================================================================
  // 请求体转换
  // ==========================================================================

  /**
   * 转换请求体为内部格式
   * @param requestBody 请求体对象（可能是引用）
   * @param doc OpenAPI 文档
   */
  private convertRequestBody(
    requestBody: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject,
    doc: OpenAPIV3.Document,
  ): RequestBodyData {
    const resolved = this.resolveRef(requestBody, doc) as OpenAPIV3.RequestBodyObject
    const content = resolved.content || {}

    // JSON 请求体
    if (content[CONTENT_TYPE_JSON]) {
      return this.convertJsonRequestBody(content[CONTENT_TYPE_JSON], resolved.description, doc)
    }

    // Form-Data 请求体
    if (content[CONTENT_TYPE_FORM_DATA]) {
      return this.convertFormRequestBody(content[CONTENT_TYPE_FORM_DATA], 'form-data', resolved.description, doc)
    }

    // URL Encoded 请求体
    if (content[CONTENT_TYPE_URL_ENCODED]) {
      return this.convertFormRequestBody(content[CONTENT_TYPE_URL_ENCODED], 'x-www-form-urlencoded', resolved.description, doc)
    }

    // XML 请求体
    if (content[CONTENT_TYPE_XML]) {
      return this.convertXmlRequestBody(content[CONTENT_TYPE_XML], resolved.description, doc)
    }

    // 纯文本请求体
    if (content[CONTENT_TYPE_TEXT]) {
      return {
        type: 'text',
        description: resolved.description,
      }
    }

    // 二进制请求体
    if (content[CONTENT_TYPE_OCTET_STREAM]) {
      return {
        type: 'binary',
        description: resolved.description,
      }
    }

    // 尝试匹配其他 JSON 类型（如 application/json; charset=utf-8）
    const jsonContentType = Object.keys(content).find(ct => ct.includes('json'))
    if (jsonContentType) {
      return this.convertJsonRequestBody(content[jsonContentType], resolved.description, doc)
    }

    return {
      type: 'none',
      description: resolved.description,
    }
  }

  /**
   * 转换 JSON 请求体
   */
  private convertJsonRequestBody(
    mediaType: OpenAPIV3.MediaTypeObject,
    description: string | undefined,
    doc: OpenAPIV3.Document,
  ): RequestBodyData {
    return {
      type: 'json',
      jsonSchema: mediaType.schema
        ? this.convertSchema(mediaType.schema as OpenAPIV3.SchemaObject, doc, 0, new Set())
        : {},
      description,
    }
  }

  /**
   * 转换表单请求体
   */
  private convertFormRequestBody(
    mediaType: OpenAPIV3.MediaTypeObject,
    type: 'form-data' | 'x-www-form-urlencoded',
    description: string | undefined,
    doc: OpenAPIV3.Document,
  ): RequestBodyData {
    const schema = mediaType.schema ? this.resolveRef(mediaType.schema, doc) : {}
    return {
      type,
      formFields: this.extractFormFields(schema as OpenAPIV3.SchemaObject, doc),
      description,
    }
  }

  /**
   * 转换 XML 请求体
   */
  private convertXmlRequestBody(
    mediaType: OpenAPIV3.MediaTypeObject,
    description: string | undefined,
    doc: OpenAPIV3.Document,
  ): RequestBodyData {
    return {
      type: 'xml',
      jsonSchema: mediaType.schema
        ? this.convertSchema(mediaType.schema as OpenAPIV3.SchemaObject, doc, 0, new Set())
        : {},
      description,
    }
  }

  // ==========================================================================
  // 响应转换
  // ==========================================================================

  /**
   * 转换响应对象
   * @param responses 响应对象集合
   * @param doc OpenAPI 文档
   */
  private convertResponses(
    responses: OpenAPIV3.ResponsesObject,
    doc: OpenAPIV3.Document,
  ): ApiResponseData[] {
    const result: ApiResponseData[] = []

    for (const [statusCode, response] of Object.entries(responses)) {
      if (!response)
        continue

      const resolvedResponse = this.resolveRef(response, doc) as OpenAPIV3.ResponseObject
      if (!resolvedResponse)
        continue

      // 处理状态码：'default' 使用特殊值 0 表示
      const httpStatus = statusCode === 'default' ? 0 : Number.parseInt(statusCode, 10)

      // 提取响应体 schema
      let body: Record<string, unknown> | undefined
      const content = resolvedResponse.content

      if (content) {
        // 优先 JSON
        const jsonContent = content[CONTENT_TYPE_JSON]
          || Object.entries(content).find(([ct]) => ct.includes('json'))?.[1]

        if (jsonContent?.schema) {
          body = this.convertSchema(jsonContent.schema as OpenAPIV3.SchemaObject, doc, 0, new Set())
        }
      }

      result.push({
        id: nanoid(),
        name: resolvedResponse.description || `响应 ${statusCode}`,
        httpStatus,
        body,
      })
    }

    return result
  }

  // ==========================================================================
  // Schema 转换
  // ==========================================================================

  /**
   * 转换 Schema 为内部格式
   * 使用回溯模式检测循环引用，避免频繁创建 Set 对象
   * @param schema Schema 对象
   * @param doc OpenAPI 文档
   * @param depth 当前递归深度
   * @param visitedRefs 已访问的引用路径集合
   */
  private convertSchema(
    schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
    doc: OpenAPIV3.Document,
    depth: number,
    visitedRefs: Set<string>,
  ): Record<string, unknown> {
    if (!schema)
      return {}

    // 深度限制检查
    if (depth > MAX_SCHEMA_DEPTH) {
      this.logger.debug(`Schema 转换达到最大深度 ${MAX_SCHEMA_DEPTH}，停止递归`)
      return { type: 'object', description: '[深度限制：省略嵌套内容]' }
    }

    let resolved: OpenAPIV3.SchemaObject
    let currentRef: string | undefined

    // 处理引用类型
    if (isReferenceObject(schema)) {
      currentRef = getRefPath(schema)

      // 循环引用检测
      if (visitedRefs.has(currentRef)) {
        this.logger.debug(`Schema 转换检测到循环引用: ${currentRef}`)
        return { type: 'object', description: `[循环引用: ${currentRef}]` }
      }

      // 添加到已访问集合
      visitedRefs.add(currentRef)
      resolved = this.resolveRef(schema, doc) as OpenAPIV3.SchemaObject
    }
    else {
      resolved = schema
    }

    if (!resolved || typeof resolved !== 'object') {
      // 回溯：移除当前引用
      if (currentRef)
        visitedRefs.delete(currentRef)
      return {}
    }

    // 构建结果对象
    const result = this.buildSchemaResult(resolved, doc, depth, visitedRefs)

    // 回溯：移除当前引用
    if (currentRef) {
      visitedRefs.delete(currentRef)
    }

    return result
  }

  /**
   * 构建 Schema 结果对象
   */
  private buildSchemaResult(
    schema: OpenAPIV3.SchemaObject,
    doc: OpenAPIV3.Document,
    depth: number,
    visitedRefs: Set<string>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {
      type: schema.type || 'object',
    }

    // 基本属性
    if (schema.description)
      result.description = schema.description
    if (schema.default !== undefined)
      result.default = schema.default
    if (schema.enum)
      result.enum = schema.enum
    if (schema.format)
      result.format = schema.format
    if (schema.nullable)
      result.nullable = schema.nullable

    // 数值约束
    if (schema.minimum !== undefined)
      result.minimum = schema.minimum
    if (schema.maximum !== undefined)
      result.maximum = schema.maximum
    if (schema.exclusiveMinimum !== undefined)
      result.exclusiveMinimum = schema.exclusiveMinimum
    if (schema.exclusiveMaximum !== undefined)
      result.exclusiveMaximum = schema.exclusiveMaximum

    // 字符串约束
    if (schema.minLength !== undefined)
      result.minLength = schema.minLength
    if (schema.maxLength !== undefined)
      result.maxLength = schema.maxLength
    if (schema.pattern)
      result.pattern = schema.pattern

    // 数组约束
    if (schema.minItems !== undefined)
      result.minItems = schema.minItems
    if (schema.maxItems !== undefined)
      result.maxItems = schema.maxItems
    if (schema.uniqueItems !== undefined)
      result.uniqueItems = schema.uniqueItems

    // 示例
    if (schema.example !== undefined)
      result.examples = [schema.example]

    // 处理 properties
    if (schema.properties) {
      result.properties = {}
      for (const [key, value] of Object.entries(schema.properties)) {
        (result.properties as Record<string, unknown>)[key] = this.convertSchema(
          value as OpenAPIV3.SchemaObject,
          doc,
          depth + 1,
          visitedRefs,
        )
      }
      if (schema.required) {
        result.required = schema.required
      }
    }

    // 处理 items（数组类型）
    if ('items' in schema && schema.items) {
      result.items = this.convertSchema(
        schema.items as OpenAPIV3.SchemaObject,
        doc,
        depth + 1,
        visitedRefs,
      )
    }

    // 处理组合类型
    if (schema.allOf) {
      result.allOf = schema.allOf.map(s =>
        this.convertSchema(s as OpenAPIV3.SchemaObject, doc, depth + 1, visitedRefs),
      )
    }
    if (schema.oneOf) {
      result.oneOf = schema.oneOf.map(s =>
        this.convertSchema(s as OpenAPIV3.SchemaObject, doc, depth + 1, visitedRefs),
      )
    }
    if (schema.anyOf) {
      result.anyOf = schema.anyOf.map(s =>
        this.convertSchema(s as OpenAPIV3.SchemaObject, doc, depth + 1, visitedRefs),
      )
    }

    // 处理 additionalProperties
    if (schema.additionalProperties !== undefined) {
      if (typeof schema.additionalProperties === 'object') {
        result.additionalProperties = this.convertSchema(
          schema.additionalProperties as OpenAPIV3.SchemaObject,
          doc,
          depth + 1,
          visitedRefs,
        )
      }
      else {
        result.additionalProperties = schema.additionalProperties
      }
    }

    return result
  }

  /**
   * 从 Schema 提取表单字段
   */
  private extractFormFields(schema: OpenAPIV3.SchemaObject, doc: OpenAPIV3.Document): ApiParamData[] {
    const resolved = this.resolveRef(schema, doc) as OpenAPIV3.SchemaObject
    const fields: ApiParamData[] = []

    if (resolved?.properties) {
      const required = resolved.required || []
      for (const [name, prop] of Object.entries(resolved.properties)) {
        const propSchema = this.resolveRef(prop, doc) as OpenAPIV3.SchemaObject
        fields.push({
          id: nanoid(),
          name,
          type: this.getSchemaType(propSchema),
          required: required.includes(name),
          description: propSchema?.description || '',
          example: propSchema?.example,
          defaultValue: propSchema?.default,
        })
      }
    }

    return fields
  }

  /**
   * 获取 Schema 类型字符串
   */
  private getSchemaType(schema: OpenAPIV3.SchemaObject): string {
    if (!schema)
      return 'string'

    // 处理 nullable
    const baseType = this.getBaseSchemaType(schema)
    return baseType
  }

  /**
   * 获取基础类型
   */
  private getBaseSchemaType(schema: OpenAPIV3.SchemaObject): string {
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

  // ==========================================================================
  // 冲突检测与预览构建
  // ==========================================================================

  /**
   * 获取现有 API 列表
   */
  private async getExistingApis(projectId: string): Promise<ConflictApiInfo[]> {
    return this.prisma.aPI.findMany({
      where: { projectId, recordStatus: 'ACTIVE' },
      select: { id: true, path: true, method: true },
    })
  }

  /**
   * 构建现有 API 的查找 Map
   * @param existingApis 现有 API 列表
   */
  private buildExistingApiMap(existingApis: ConflictApiInfo[]): Map<string, ConflictApiInfo> {
    const map = new Map<string, ConflictApiInfo>()
    for (const api of existingApis) {
      map.set(buildApiKey(api.method, api.path), api)
    }
    return map
  }

  /**
   * 构建预览数据
   */
  private buildPreviewData(
    apis: InternalApiData[],
    existingApiMap: Map<string, ConflictApiInfo>,
  ): { parsedApis: ParsedApiPreview[], groupsMap: Map<string, ParsedGroupPreview> } {
    const parsedApis: ParsedApiPreview[] = []
    const groupsMap = new Map<string, ParsedGroupPreview>()

    for (const api of apis) {
      const conflictApi = existingApiMap.get(buildApiKey(api.method, api.path))

      parsedApis.push({
        path: api.path,
        method: api.method,
        name: api.name,
        groupName: api.groupName,
        description: api.description,
        hasConflict: !!conflictApi,
        conflictApiId: conflictApi?.id,
      })

      // 更新分组统计
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

    return { parsedApis, groupsMap }
  }

  /**
   * 构建导入统计信息
   */
  private buildImportStats(parsedApis: ParsedApiPreview[]): ImportStats {
    const conflictApis = parsedApis.filter(a => a.hasConflict).length
    return {
      totalApis: parsedApis.length,
      newApis: parsedApis.length - conflictApis,
      conflictApis,
    }
  }

  // ==========================================================================
  // 导入执行
  // ==========================================================================

  /**
   * 验证 API 数量限制
   * - skip: 只计算不冲突的新 API
   * - overwrite: 只计算不冲突的新 API（覆盖不增加数量）
   * - rename: 所有导入的 API 都会新增（冲突的会重命名）
   */
  private async validateApiLimit(
    projectId: string,
    apis: InternalApiData[],
    existingApiMap: Map<string, ConflictApiInfo>,
    conflictStrategy: ConflictStrategy,
  ): Promise<void> {
    const projectMaxApis = this.systemConfigService.get<number>(SystemConfigKey.PROJECT_MAX_APIS)
    const currentApiCount = await this.prisma.aPI.count({
      where: { projectId, recordStatus: 'ACTIVE' },
    })

    // 根据冲突策略计算实际新增数量
    let newApisCount: number
    if (conflictStrategy === ConflictStrategy.RENAME) {
      // rename 策略：所有 API 都会创建（冲突的会重命名后创建）
      newApisCount = apis.length
    }
    else {
      // skip/overwrite 策略：只有不冲突的 API 会新增
      // overwrite 是更新现有 API，不增加数量
      newApisCount = apis.filter(api =>
        !existingApiMap.has(buildApiKey(api.method, api.path)),
      ).length
    }

    if (currentApiCount + newApisCount > projectMaxApis) {
      throw new HanaException('PROJECT_API_LIMIT_EXCEEDED')
    }
  }

  /**
   * 导入 API
   */
  private async performImport(
    dto: ExecuteImportReqDto,
    projectId: string,
    userId: string,
    apis: InternalApiData[],
    existingApiMap: Map<string, ConflictApiInfo>,
  ): Promise<ImportResultResDto> {
    const results: ImportedApiResult[] = []
    const createdGroups: string[] = []
    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0
    let failedCount = 0

    // 获取现有分组
    const groupNameToId = await this.getExistingGroupMap(projectId)

    await this.prisma.$transaction(async (tx) => {
      // 创建缺失的分组
      if (dto.createMissingGroups !== false) {
        await this.createMissingGroups(tx, apis, groupNameToId, projectId, createdGroups)
      }

      // 处理每个 API
      for (const api of apis) {
        const conflictApi = existingApiMap.get(buildApiKey(api.method, api.path))
        const groupId = this.resolveGroupId(dto.targetGroupId, api.groupName, groupNameToId)

        // 确保有分组
        const finalGroupId = await this.ensureGroupExists(
          tx,
          groupId,
          groupNameToId,
          projectId,
          createdGroups,
        )

        try {
          const result = await this.processApiImport(
            tx,
            api,
            conflictApi,
            finalGroupId,
            projectId,
            userId,
            dto.conflictStrategy,
          )

          results.push(result.apiResult)

          switch (result.action) {
            case 'created':
              createdCount++
              break
            case 'updated':
              updatedCount++
              break
            case 'skipped':
              skippedCount++
              break
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

  /**
   * 获取现有分组映射
   */
  private async getExistingGroupMap(projectId: string): Promise<Map<string, string>> {
    const groups = await this.prisma.aPIGroup.findMany({
      where: { projectId, status: 'ACTIVE' },
      select: { id: true, name: true },
    })

    const map = new Map<string, string>()
    for (const group of groups) {
      map.set(group.name, group.id)
    }
    return map
  }

  /**
   * 创建缺失的分组
   */
  private async createMissingGroups(
    tx: TransactionClient,
    apis: InternalApiData[],
    groupNameToId: Map<string, string>,
    projectId: string,
    createdGroups: string[],
  ): Promise<void> {
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

  /**
   * 解析分组 ID
   */
  private resolveGroupId(
    targetGroupId: string | undefined,
    groupName: string,
    groupNameToId: Map<string, string>,
  ): string | undefined {
    return targetGroupId || groupNameToId.get(groupName)
  }

  /**
   * 确保分组存在
   */
  private async ensureGroupExists(
    tx: TransactionClient,
    groupId: string | undefined,
    groupNameToId: Map<string, string>,
    projectId: string,
    createdGroups: string[],
  ): Promise<string> {
    if (groupId) {
      return groupId
    }

    // 创建或获取默认分组
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

    return groupNameToId.get(DEFAULT_GROUP_NAME)!
  }

  /**
   * 处理单个 API 导入
   */
  private async processApiImport(
    tx: TransactionClient,
    api: InternalApiData,
    conflictApi: ConflictApiInfo | undefined,
    groupId: string,
    projectId: string,
    userId: string,
    conflictStrategy: ConflictStrategy,
  ): Promise<{ apiResult: ImportedApiResult, action: 'created' | 'updated' | 'skipped' }> {
    if (conflictApi) {
      return this.handleConflict(tx, api, conflictApi, groupId, projectId, userId, conflictStrategy)
    }

    // 创建新 API
    const newApi = await this.createNewApi(tx, api, groupId, projectId, userId)
    return {
      apiResult: {
        name: api.name,
        path: api.path,
        method: api.method,
        status: 'created',
        apiId: newApi.id,
      },
      action: 'created',
    }
  }

  /**
   * 处理冲突
   */
  private async handleConflict(
    tx: TransactionClient,
    api: InternalApiData,
    conflictApi: ConflictApiInfo,
    groupId: string,
    projectId: string,
    userId: string,
    strategy: ConflictStrategy,
  ): Promise<{ apiResult: ImportedApiResult, action: 'created' | 'updated' | 'skipped' }> {
    switch (strategy) {
      case ConflictStrategy.SKIP:
        return {
          apiResult: {
            name: api.name,
            path: api.path,
            method: api.method,
            status: 'skipped',
          },
          action: 'skipped',
        }

      case ConflictStrategy.OVERWRITE:
        await this.updateExistingApi(tx, conflictApi.id, api, userId)
        return {
          apiResult: {
            name: api.name,
            path: api.path,
            method: api.method,
            status: 'updated',
            apiId: conflictApi.id,
          },
          action: 'updated',
        }

      case ConflictStrategy.RENAME: {
        const renamedPath = `${api.path}_imported`
        const renamedApi = await this.createNewApi(
          tx,
          { ...api, path: renamedPath },
          groupId,
          projectId,
          userId,
        )
        return {
          apiResult: {
            name: api.name,
            path: renamedPath,
            method: api.method,
            status: 'created',
            apiId: renamedApi.id,
          },
          action: 'created',
        }
      }
    }
  }

  // ==========================================================================
  // 数据库操作
  // ==========================================================================

  /**
   * 创建新 API
   */
  private async createNewApi(
    tx: TransactionClient,
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
        requestHeaders: toJsonValue(api.requestHeaders),
        pathParams: toJsonValue(api.pathParams),
        queryParams: toJsonValue(api.queryParams),
        requestBody: toJsonValue(api.requestBody),
        responses: toJsonValue(api.responses),
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

  /**
   * 更新现有 API
   */
  private async updateExistingApi(
    tx: TransactionClient,
    apiId: string,
    api: InternalApiData,
    userId: string,
  ): Promise<void> {
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
        changes: [
          VersionChangeType.BASIC_INFO,
          VersionChangeType.REQUEST_PARAM,
          VersionChangeType.REQUEST_BODY,
          VersionChangeType.RESPONSE,
        ],
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
        requestHeaders: toJsonValue(api.requestHeaders),
        pathParams: toJsonValue(api.pathParams),
        queryParams: toJsonValue(api.queryParams),
        requestBody: toJsonValue(api.requestBody),
        responses: toJsonValue(api.responses),
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
        changes: [
          VersionChangeType.BASIC_INFO,
          VersionChangeType.REQUEST_PARAM,
          VersionChangeType.REQUEST_BODY,
          VersionChangeType.RESPONSE,
        ],
        description: '从 OpenAPI 文档更新',
        metadata: { source: 'openapi-import' },
      },
      tx,
    )
  }
}
