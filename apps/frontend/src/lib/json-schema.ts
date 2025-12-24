import type { LocalSchemaNode } from '@/types/json-schema'
import { nanoid } from 'nanoid'

/** JSON Schema 支持的字段类型 */
export type SchemaFieldType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null'

/** JSON Schema 支持的字段类型 */
export const SCHEMA_FIELD_TYPES: SchemaFieldType[] = ['string', 'number', 'integer', 'boolean', 'array', 'object', 'null']

/** 验证是否为有效的 Schema 字段类型 */
function isValidSchemaFieldType(type: unknown): type is SchemaFieldType {
  return SCHEMA_FIELD_TYPES.includes(type as SchemaFieldType)
}

/** 安全获取 Schema 字段类型，无效时返回默认类型 */
function getSchemaFieldType(type: unknown, defaultType: SchemaFieldType = 'string'): SchemaFieldType {
  return isValidSchemaFieldType(type) ? type : defaultType
}

/**
 * 将 JSON Schema 的单个 property 转换为 LocalSchemaNode
 * @param prop JSON Schema property 对象
 * @param name 字段名
 * @param isRequired 是否必填
 * @param options 可选配置
 * @param options.isRoot 是否为根节点
 * @returns LocalSchemaNode
 */
function schemaPropertyToNode(
  prop: Record<string, unknown>,
  name: string,
  isRequired: boolean,
  options?: { isRoot?: boolean },
): LocalSchemaNode {
  const type = getSchemaFieldType(prop.type, 'string')

  const node: LocalSchemaNode = {
    id: nanoid(),
    name,
    type,
    required: isRequired,
    description: (prop.description as string) ?? '',
    example: prop.example !== undefined ? String(prop.example) : undefined,
  }

  // 设置根节点标识
  if (options?.isRoot) {
    node.isRoot = true
  }

  // 递归处理 object 类型
  if (type === 'object') {
    node.children = schemaPropertiesToChildren(prop)
  }

  // 递归处理 array 类型
  if (type === 'array') {
    node.item = prop.items
      ? schemaItemsToNode(prop.items as Record<string, unknown>)
      : genArrayItemNode()
  }

  return node
}

/**
 * 将 JSON Schema 的 items 转换为 LocalSchemaNode
 * @param items JSON Schema items 对象
 * @returns LocalSchemaNode
 */
function schemaItemsToNode(items: Record<string, unknown>): LocalSchemaNode {
  const itemType = getSchemaFieldType(items.type, 'string')

  const node: LocalSchemaNode = {
    id: nanoid(),
    isArrayItem: true,
    name: 'ITEMS',
    type: itemType,
    required: false,
    description: (items.description as string) ?? '',
    example: items.example !== undefined ? String(items.example) : undefined,
  }

  // 递归处理 object 类型
  if (itemType === 'object') {
    node.children = schemaPropertiesToChildren(items)
  }

  // 递归处理嵌套 array 类型
  if (itemType === 'array') {
    node.item = items.items
      ? schemaItemsToNode(items.items as Record<string, unknown>)
      : genArrayItemNode()
  }

  return node
}

/**
 * 将 JSON Schema 的 properties 转换为子节点数组
 * @param schema JSON Schema 对象
 * @returns 子节点数组
 */
function schemaPropertiesToChildren(schema: Record<string, unknown>): LocalSchemaNode[] {
  const properties = (schema.properties ?? {}) as Record<string, Record<string, unknown>>
  const required = (schema.required ?? []) as string[]

  return Object.entries(properties).map(([name, prop]) => {
    return schemaPropertyToNode(prop, name, required.includes(name))
  })
}

/**
 * 将 JSON Schema 转换为单个根节点
 * @param schema JSON Schema 对象
 * @returns 根节点
 */
export function schemaToNode(schema: Record<string, unknown> | null): LocalSchemaNode {
  if (!schema) {
    return genRootSchemaNode()
  }

  return schemaPropertyToNode(schema, '根节点', true, { isRoot: true })
}

/**
 * 将单个 LocalSchemaNode 转换为 JSON Schema property
 * @param node LocalSchemaNode
 * @returns JSON Schema property 对象
 */
function nodeToSchemaProperty(node: LocalSchemaNode): Record<string, unknown> {
  const prop: Record<string, unknown> = {
    type: node.type,
  }

  // 只添加非空描述
  if (node.description && node.description.trim()) {
    prop.description = node.description.trim()
  }

  // 只添加非空示例值
  if (node.example !== undefined && node.example !== '') {
    prop.example = node.example
  }

  // 递归处理 object 类型
  if (node.type === 'object') {
    const children = node.children ?? []
    const childSchema = childrenToSchemaProperties(children)
    prop.properties = childSchema.properties ?? {}
    if (Array.isArray(childSchema.required) && childSchema.required.length > 0) {
      prop.required = childSchema.required
    }
  }

  // 递归处理 array 类型
  if (node.type === 'array') {
    prop.items = node.item
      ? nodeToSchemaItems(node.item)
      : { type: 'string' } // 默认 items 类型
  }

  return prop
}

/**
 * 将 LocalSchemaNode（array item）转换为 JSON Schema items
 * @param node LocalSchemaNode
 * @returns JSON Schema items 对象
 */
function nodeToSchemaItems(node: LocalSchemaNode): Record<string, unknown> {
  const items: Record<string, unknown> = {
    type: node.type,
  }

  // 只添加非空描述
  if (node.description && node.description.trim()) {
    items.description = node.description.trim()
  }

  // 只添加非空示例值
  if (node.example !== undefined && node.example !== '') {
    items.example = node.example
  }

  // 递归处理 object 类型
  if (node.type === 'object') {
    const children = node.children ?? []
    const childSchema = childrenToSchemaProperties(children)
    items.properties = childSchema.properties ?? {}
    if (Array.isArray(childSchema.required) && childSchema.required.length > 0) {
      items.required = childSchema.required
    }
  }

  // 递归处理嵌套 array 类型
  if (node.type === 'array') {
    items.items = node.item
      ? nodeToSchemaItems(node.item)
      : { type: 'string' } // 默认 items 类型
  }

  return items
}

/**
 * 将子节点数组转换为 JSON Schema 格式
 * @param nodes 子节点数组
 * @returns JSON Schema 对象
 */
function childrenToSchemaProperties(nodes: LocalSchemaNode[]): Record<string, unknown> {
  const properties: Record<string, unknown> = {}
  const required: string[] = []

  for (const node of nodes) {
    // 跳过空字段名
    if (!node.name.trim()) {
      continue
    }

    properties[node.name] = nodeToSchemaProperty(node)

    if (node.required) {
      required.push(node.name)
    }
  }

  return {
    properties,
    ...(required.length > 0 ? { required } : {}),
  }
}

/**
 * 将单个根节点转换回 JSON Schema
 * @param node 根节点
 * @returns JSON Schema 对象
 */
export function nodeToSchema(node: LocalSchemaNode): Record<string, unknown> {
  return nodeToSchemaProperty(node)
}

/** 生成根节点 */
export function genRootSchemaNode(): LocalSchemaNode {
  return {
    isRoot: true,
    id: nanoid(),
    name: '根节点',
    type: 'string',
    required: true,
    description: '',
    children: [],
  }
}

/** 生成新节点 */
export function genNewNode(): LocalSchemaNode {
  return {
    id: nanoid(),
    name: '',
    type: 'string',
    required: false,
    description: '',
  }
}

/** 生成 array item 节点 */
export function genArrayItemNode(): LocalSchemaNode {
  return {
    id: nanoid(),
    isArrayItem: true,
    name: 'ITEMS',
    type: 'string',
    required: false,
    description: '',
  }
}
