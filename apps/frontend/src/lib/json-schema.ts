import type { ParamType } from '@/types/api'
import type { LocalSchemaNode } from '@/types/json-schema'
import { generateKey } from '@/lib/utils'

/**
 * 将 JSON Schema 的 properties 转换为子节点数组
 * @param schema JSON Schema 对象
 * @returns 子节点数组
 */
function schemaPropertiesToChildren(schema: Record<string, unknown>): LocalSchemaNode[] {
  const properties = (schema.properties ?? {}) as Record<string, Record<string, unknown>>
  const required = (schema.required ?? []) as string[]

  return Object.entries(properties).map(([name, prop]) => {
    const type = (prop.type as ParamType) || 'string'
    const node: LocalSchemaNode = {
      id: generateKey(),
      name,
      type,
      required: required.includes(name),
      description: (prop.description as string) || '',
      example: prop.example !== undefined ? String(prop.example) : undefined,
    }

    // 递归处理 object 类型
    if (type === 'object' && prop.properties) {
      node.children = schemaPropertiesToChildren(prop)
    }

    // 递归处理 array 类型
    if (type === 'array' && prop.items) {
      const items = prop.items as Record<string, unknown>
      const itemType = (items.type as ParamType) || 'string'
      node.item = {
        id: generateKey(),
        name: 'items',
        type: itemType,
        required: false,
        description: '',
      }
      if (itemType === 'object' && items.properties) {
        node.item.children = schemaPropertiesToChildren(items)
      }
    }

    return node
  })
}

/**
 * 将 JSON Schema 转换为单个根节点
 * @param schema JSON Schema 对象
 * @returns 根节点（包含 children）
 */
export function schemaToNode(schema: Record<string, unknown> | null): LocalSchemaNode {
  const root: LocalSchemaNode = {
    isRoot: true,
    id: generateKey(),
    name: '根节点',
    type: 'object',
    required: true,
    description: '',
    children: [],
  }

  if (!schema || typeof schema !== 'object') {
    return root
  }

  root.children = schemaPropertiesToChildren(schema)
  return root
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

    const prop: Record<string, unknown> = {
      type: node.type,
    }

    if (node.description) {
      prop.description = node.description
    }

    if (node.example !== undefined && node.example !== '') {
      prop.example = node.example
    }

    // 递归处理 object 类型
    if (node.type === 'object' && node.children) {
      const childSchema = childrenToSchemaProperties(node.children)
      prop.properties = childSchema.properties
      if (Array.isArray(childSchema.required) && childSchema.required.length > 0) {
        prop.required = childSchema.required
      }
    }

    // 递归处理 array 类型
    if (node.type === 'array' && node.item) {
      if (node.item.type === 'object' && node.item.children) {
        const itemSchema = childrenToSchemaProperties(node.item.children)
        prop.items = {
          type: 'object',
          properties: itemSchema.properties,
          ...(Array.isArray(itemSchema.required) && itemSchema.required.length > 0
            ? { required: itemSchema.required }
            : {}),
        }
      }
      else {
        prop.items = { type: node.item.type }
      }
    }

    properties[node.name] = prop

    if (node.required) {
      required.push(node.name)
    }
  }

  return {
    type: 'object',
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
  if (!node.children || node.children.length === 0) {
    return { type: 'object', properties: {} }
  }

  return childrenToSchemaProperties(node.children)
}

/**
 * 生成 Root Schema Node（初始化）
 * @returns 新的根节点
 */
export function genRootSchemaNode(): LocalSchemaNode {
  return {
    isRoot: true,
    id: generateKey(),
    name: '根节点',
    type: 'object',
    required: true,
    description: '',
    children: [],
  }
}
