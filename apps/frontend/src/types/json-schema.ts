import type { SchemaFieldType } from '@/lib/json-schema'

/** 本地 Schema 节点类型 */
export interface LocalSchemaNode {
  /** 结构是否发生变化 */
  schemaChanged?: boolean
  /** 是否是根节点（每个 JSON Schema 拥有唯一的基底根节点） */
  isRoot?: boolean
  /** 是否是数组项节点（array 类型的 items） */
  isArrayItem?: boolean
  /** 唯一标识 */
  id: string
  /** 字段名 */
  name: string
  /** 字段类型 */
  type: SchemaFieldType
  /** 是否必填 */
  required: boolean
  /** 字段描述 */
  description: string
  /** 示例值 */
  example?: string
  /** 子节点（object 类型） */
  children?: LocalSchemaNode[]
  /** 数组项类型（array 类型） */
  item?: LocalSchemaNode
}
