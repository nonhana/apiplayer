<script lang="ts" setup>
import type { LocalSchemaNode } from '@/types/json-schema'
import JsonSchemaNode from './JsonSchemaNode.vue'

const root = defineModel<LocalSchemaNode>({ required: true })

// 根据 id path 获取指定 node 的引用
function getPathNode(node: LocalSchemaNode | null, pathArr: string[]): LocalSchemaNode | null {
  if (!node)
    return null
  if (!pathArr.length)
    return node

  const [curId, ...rest] = pathArr

  // 当前节点 id 匹配，继续处理剩余路径
  if (node.id === curId) {
    return getPathNode(node, rest)
  }

  let curNode: LocalSchemaNode | null = null

  if (node.type === 'object' && node.children?.length) {
    curNode = node.children.find(item => item.id === curId) ?? null
  }
  else if (node.type === 'array' && node.item) {
    curNode = node.item.id === curId ? node.item : null
  }

  return getPathNode(curNode, rest)
}

function pathToArr(path: string): string[] {
  if (!path)
    return []
  return path.split('-').filter(Boolean)
}

function handleAddNode({ newNode, path }: { newNode: LocalSchemaNode, path: string }) {
  const pathArr = pathToArr(path)
  const node = getPathNode(root.value, pathArr)

  if (!node || node.type !== 'object')
    return

  if (!node.children) {
    node.children = []
  }
  node.children.push(newNode)
}

function handleUpdateNode({ patch, path }: { patch: { key: string, value: unknown }, path: string }) {
  const pathArr = pathToArr(path)
  const node = getPathNode(root.value, pathArr)

  if (!node) {
    return
  }

  ;(node as unknown as Record<string, unknown>)[patch.key] = patch.value
}

function handleDeleteNode({ path }: { path: string }) {
  const pathArr = pathToArr(path)

  if (pathArr.length === 0)
    return // 不能删除根节点

  const curId = pathArr[pathArr.length - 1]
  const parentPath = pathArr.slice(0, -1)

  const parentNode = getPathNode(root.value, parentPath)
  if (!parentNode || parentNode.type !== 'object' || !parentNode.children)
    return

  parentNode.children = parentNode.children.filter(item => item.id !== curId)
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
