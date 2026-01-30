<script lang="ts" setup>
import type { LocalSchemaNode } from '@/types/json-schema'
import { computed, getCurrentInstance } from 'vue'
import { useApiEditorStore } from '@/stores/useApiEditorStore'
import JsonSchemaNode from './JsonSchemaNode.vue'

const emits = defineEmits<{
  (e: 'delRoot'): void
}>()

const instance = getCurrentInstance()

const allowDelRoot = computed(() => {
  return !!instance?.vnode.props?.onDelRoot
})

const apiEditorStore = useApiEditorStore()
const { setIsDirty } = apiEditorStore

const root = defineModel<LocalSchemaNode>({ required: true })

/**
 * 根据 id 路径获取指定节点的引用
 * 路径格式：'rootId.childId.grandchildId'
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
  if (!node) {
    return null
  }

  if (!pathArr.length) {
    return node
  }

  const [curId, ...rest] = pathArr

  if (node.id === curId) {
    return getPathNode(node, rest)
  }

  let targetNode: LocalSchemaNode | null = null

  if (node.type === 'object' && Array.isArray(node.children)) {
    targetNode = node.children.find(child => child.id === curId) ?? null
  }
  else if (node.type === 'array' && node.item) {
    targetNode = node.item.id === curId ? node.item : null
  }

  return getPathNode(targetNode, rest)
}

function pathToArr(path: string): string[] {
  if (!path || typeof path !== 'string') {
    return []
  }
  return path.split('.').filter(Boolean)
}

function handleAddNode({ newNode, path }: { newNode: LocalSchemaNode, path: string }) {
  root.value.schemaChanged = true
  const pathArr = pathToArr(path)
  const node = getPathNode(root.value, pathArr)

  if (!node || node.type !== 'object') {
    console.warn('[JsonSchemaEditor] 添加节点失败：目标节点不存在或不是 object 类型', { path })
    return
  }

  if (!Array.isArray(node.children)) {
    node.children = []
  }

  node.children.push(newNode)
  setIsDirty(true)
}

function handleUpdateNode({ patch, path }: { patch: { key: string, value: unknown }, path: string }) {
  if (patch.key !== 'description' && patch.key !== 'example') {
    root.value.schemaChanged = true
  }

  const pathArr = pathToArr(path)
  const node = getPathNode(root.value, pathArr)

  if (!node) {
    console.warn('[JsonSchemaEditor] 更新节点失败：节点不存在', { path, patch })
    return
  }

  ;(node as unknown as Record<string, unknown>)[patch.key] = patch.value
  setIsDirty(true)
}

function handleDeleteNode({ path }: { path: string }) {
  root.value.schemaChanged = true
  const pathArr = pathToArr(path)

  if (pathArr.length === 1) {
    if (allowDelRoot.value) {
      emits('delRoot')
    }
    else {
      console.warn('[JsonSchemaEditor] 删除节点失败：不能删除根节点', { path })
    }
    return
  }

  const targetId = pathArr[pathArr.length - 1]
  const parentPath = pathArr.slice(0, -1)

  const parentNode = getPathNode(root.value, parentPath)

  if (!parentNode || parentNode.type !== 'object' || !Array.isArray(parentNode.children)) {
    console.warn('[JsonSchemaEditor] 删除节点失败：父节点不存在或无法删除子节点', { path })
    return
  }

  parentNode.children = parentNode.children.filter(child => child.id !== targetId)
  setIsDirty(true)
}
</script>

<template>
  <JsonSchemaNode
    :node="root"
    path=""
    :allow-del-root="allowDelRoot"
    @add-node="handleAddNode"
    @update-node="handleUpdateNode"
    @delete-node="handleDeleteNode"
  />
</template>
