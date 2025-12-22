<script lang="ts" setup>
import type { LocalSchemaNode } from '@/types/json-schema'
import JsonSchemaNode from './JsonSchemaNode.vue'

const root = defineModel<LocalSchemaNode>({ required: true })

/**
 * 根据 id 路径获取指定节点的引用
 * 路径格式：'rootId-childId-grandchildId'
 *
 * 查找逻辑：
 * 1. 如果当前节点 id 匹配路径第一个元素，继续处理剩余路径
 * 2. 否则，在当前节点的子节点（children 或 item）中查找匹配的节点
 *
 * @param node 当前节点
 * @param pathArr 路径数组
 * @returns 目标节点或 null
 */
function getPathNode(node: LocalSchemaNode | null, pathArr: string[]): LocalSchemaNode | null {
  // 边界：节点为空
  if (!node) {
    return null
  }

  // 边界：路径为空，返回当前节点
  if (!pathArr.length) {
    return node
  }

  const [curId, ...rest] = pathArr

  // 当前节点 id 匹配路径第一个元素，继续处理剩余路径
  if (node.id === curId) {
    return getPathNode(node, rest)
  }

  // 在子节点中查找匹配的节点
  let targetNode: LocalSchemaNode | null = null

  if (node.type === 'object' && Array.isArray(node.children)) {
    targetNode = node.children.find(child => child.id === curId) ?? null
  }
  else if (node.type === 'array' && node.item) {
    targetNode = node.item.id === curId ? node.item : null
  }

  // 递归处理剩余路径
  return getPathNode(targetNode, rest)
}

/** 将路径字符串转换为数组 */
function pathToArr(path: string): string[] {
  if (!path || typeof path !== 'string') {
    return []
  }
  return path.split('-').filter(Boolean)
}

/**
 * 处理添加节点事件
 * 只有 object 类型的节点才能添加子节点
 */
function handleAddNode({ newNode, path }: { newNode: LocalSchemaNode, path: string }) {
  const pathArr = pathToArr(path)
  const node = getPathNode(root.value, pathArr)

  // 验证目标节点存在且为 object 类型
  if (!node || node.type !== 'object') {
    console.warn('[JsonSchemaEditor] 添加节点失败：目标节点不存在或不是 object 类型', { path })
    return
  }

  // 确保 children 数组存在
  if (!Array.isArray(node.children)) {
    node.children = []
  }

  node.children.push(newNode)
}

/**
 * 处理更新节点事件
 * 支持更新节点的任意属性
 */
function handleUpdateNode({ patch, path }: { patch: { key: string, value: unknown }, path: string }) {
  const pathArr = pathToArr(path)
  const node = getPathNode(root.value, pathArr)

  if (!node) {
    console.warn('[JsonSchemaEditor] 更新节点失败：节点不存在', { path, patch })
    return
  }

  // 类型安全地更新属性
  ;(node as unknown as Record<string, unknown>)[patch.key] = patch.value
}

/**
 * 处理删除节点事件
 * 根节点和数组项节点不可删除
 */
function handleDeleteNode({ path }: { path: string }) {
  const pathArr = pathToArr(path)

  // 不能删除根节点
  if (pathArr.length === 0) {
    console.warn('[JsonSchemaEditor] 删除节点失败：不能删除根节点')
    return
  }

  const targetId = pathArr[pathArr.length - 1]
  const parentPath = pathArr.slice(0, -1)

  const parentNode = getPathNode(root.value, parentPath)

  // 验证父节点存在且有 children
  if (!parentNode || parentNode.type !== 'object' || !Array.isArray(parentNode.children)) {
    console.warn('[JsonSchemaEditor] 删除节点失败：父节点不存在或无法删除子节点', { path })
    return
  }

  parentNode.children = parentNode.children.filter(child => child.id !== targetId)
}
</script>

<template>
  <JsonSchemaNode
    :node="root"
    path=""
    @add-node="handleAddNode"
    @update-node="handleUpdateNode"
    @delete-node="handleDeleteNode"
  />
</template>
