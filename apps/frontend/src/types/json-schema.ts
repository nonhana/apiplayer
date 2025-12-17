import type { ParamType } from '@/types/api'

/** 本地 Schema 节点类型 */
export interface LocalSchemaNode {
  isRoot?: boolean // 是否是根节点（每个 JSON Schema 拥有唯一的基底根节点）
  id: string // 唯一标识
  name: string
  type: ParamType
  required: boolean
  description: string
  example?: string
  /** 子节点（object 类型） */
  children?: LocalSchemaNode[]
  /** 数组项类型（array 类型） */
  item?: LocalSchemaNode
}
