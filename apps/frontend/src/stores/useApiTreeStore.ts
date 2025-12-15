import type { ApiBrief, CloneApiReq, GroupNodeWithApis, HttpMethod } from '@/types/api'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiApi, groupApi } from '@/api/api'

type LoadingStatus = 'start' | 'loading' | 'end'

/** API 树状态管理 */
export const useApiTreeStore = defineStore('apiTree', () => {
  // ========== 状态 ==========

  /** 分组树数据 */
  const tree = ref<GroupNodeWithApis[]>([])

  /** 加载状态 */
  const loadingStatus = ref<LoadingStatus>('start')

  /** 当前项目 ID */
  const projectId = ref('')

  /** 展开的分组 ID 集合 */
  const expandedKeys = ref<Set<string>>(new Set())

  /** 搜索关键词 */
  const searchQuery = ref('')

  /** 当前选中的节点 ID */
  const selectedNodeId = ref<string | null>(null)

  /** 选中节点的类型 */
  const selectedNodeType = ref<'group' | 'api' | null>(null)

  // ========== 计算属性 ==========

  /** 是否有树数据 */
  const hasTree = computed(() => tree.value.length > 0)

  /** 过滤后的树（根据搜索关键词） */
  const filteredTree = computed(() => {
    if (!searchQuery.value.trim())
      return tree.value

    const query = searchQuery.value.toLowerCase()
    return filterTreeByQuery(tree.value, query)
  })

  // ========== 辅助方法 ==========

  /** 根据关键词过滤树 */
  function filterTreeByQuery(nodes: GroupNodeWithApis[], query: string): GroupNodeWithApis[] {
    return nodes
      .map((node) => {
        // 过滤匹配的 API
        const matchedApis = node.apis.filter(
          api => api.name.toLowerCase().includes(query)
            || api.path.toLowerCase().includes(query),
        )

        // 递归过滤子分组
        const matchedChildren = filterTreeByQuery(node.children, query)

        // 如果分组名匹配，或者有匹配的 API 或子分组，则保留该节点
        const groupNameMatches = node.name.toLowerCase().includes(query)
        const hasMatchedContent = matchedApis.length > 0 || matchedChildren.length > 0

        if (groupNameMatches || hasMatchedContent) {
          return {
            ...node,
            apis: groupNameMatches ? node.apis : matchedApis,
            children: matchedChildren,
          }
        }
        return null
      })
      .filter((node): node is GroupNodeWithApis => node !== null)
  }

  /** 在树中查找分组 */
  function findGroupInTree(nodes: GroupNodeWithApis[], groupId: string): GroupNodeWithApis | null {
    for (const node of nodes) {
      if (node.id === groupId)
        return node
      const found = findGroupInTree(node.children, groupId)
      if (found)
        return found
    }
    return null
  }

  /** 在树中查找 API 所属的分组 */
  function findGroupByApiId(nodes: GroupNodeWithApis[], apiId: string): GroupNodeWithApis | null {
    for (const node of nodes) {
      if (node.apis.some(api => api.id === apiId))
        return node
      const found = findGroupByApiId(node.children, apiId)
      if (found)
        return found
    }
    return null
  }

  /** 根据 apiId 查找其所在 group 的路径 */
  function findGroupPathByApiId(apiId: string): string[] {
    const path: string[] = []

    function search(nodes: GroupNodeWithApis[]): boolean {
      for (const node of nodes) {
        // 检查当前分组是否包含目标 API
        if (node.apis.some(api => api.id === apiId)) {
          path.push(node.id)
          return true
        }
        // 递归搜索子分组
        if (search(node.children)) {
          path.unshift(node.id) // 将父分组添加到路径前面
          return true
        }
      }
      return false
    }

    search(tree.value)
    return path
  }

  /** 批量展开指定路径上的所有分组 */
  function expandGroupPath(pathGroupIds: string[]) {
    for (const id of pathGroupIds) {
      expandedKeys.value.add(id)
    }
  }

  // ========== 操作方法 ==========

  /** 设置项目 ID */
  function setProjectId(id: string) {
    projectId.value = id
  }

  /** 获取分组树数据 */
  async function fetchTree(id?: string) {
    const targetProjectId = id || projectId.value
    if (!targetProjectId)
      return

    projectId.value = targetProjectId
    loadingStatus.value = 'loading'

    try {
      const data = await groupApi.getGroupTreeWithApis(targetProjectId)
      tree.value = data
    }
    finally {
      loadingStatus.value = 'end'
    }
  }

  /** 刷新树数据 */
  async function refreshTree() {
    await fetchTree()
  }

  /** 切换分组展开/折叠状态 */
  function toggleExpand(groupId: string) {
    if (expandedKeys.value.has(groupId)) {
      expandedKeys.value.delete(groupId)
    }
    else {
      expandedKeys.value.add(groupId)
    }
  }

  /** 展开分组 */
  function expandGroup(groupId: string) {
    expandedKeys.value.add(groupId)
  }

  /** 折叠分组 */
  function collapseGroup(groupId: string) {
    expandedKeys.value.delete(groupId)
  }

  /** 展开所有分组 */
  function expandAll() {
    const collectIds = (nodes: GroupNodeWithApis[]): string[] => {
      return nodes.flatMap(node => [node.id, ...collectIds(node.children)])
    }
    expandedKeys.value = new Set(collectIds(tree.value))
  }

  /** 折叠所有分组 */
  function collapseAll() {
    expandedKeys.value.clear()
  }

  /** 检查分组是否展开 */
  function isExpanded(groupId: string): boolean {
    return expandedKeys.value.has(groupId)
  }

  /** 设置搜索关键词 */
  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  /** 选中节点 */
  function selectNode(nodeId: string, type: 'group' | 'api') {
    selectedNodeId.value = nodeId
    selectedNodeType.value = type
  }

  /** 清除选中 */
  function clearSelection() {
    selectedNodeId.value = null
    selectedNodeType.value = null
  }

  /** 创建分组 */
  async function createGroup(name: string, parentId?: string) {
    if (!projectId.value)
      return null

    const group = await groupApi.createGroup(projectId.value, {
      name,
      parentId,
    })

    // 刷新树以获取最新数据
    await refreshTree()

    // 如果有父分组，自动展开
    if (parentId) {
      expandGroup(parentId)
    }

    return group
  }

  /** 更新分组 */
  async function updateGroup(groupId: string, name: string) {
    if (!projectId.value)
      return null

    const group = await groupApi.updateGroup(projectId.value, groupId, { name })
    await refreshTree()
    return group
  }

  /** 删除分组 */
  async function deleteGroup(groupId: string, cascade = false) {
    if (!projectId.value)
      return

    await groupApi.deleteGroup(projectId.value, groupId, { cascade })
    await refreshTree()

    // 如果删除的是选中的节点，清除选中状态
    if (selectedNodeId.value === groupId) {
      clearSelection()
    }
  }

  /** 创建 API */
  async function createApi(
    groupId: string,
    name: string,
    path: string,
    method: HttpMethod,
  ) {
    if (!projectId.value)
      return null

    const api = await apiApi.createApi(projectId.value, {
      groupId,
      name,
      path,
      method,
    })

    await refreshTree()
    expandGroup(groupId)

    return api
  }

  /** 删除 API */
  async function deleteApi(apiId: string) {
    if (!projectId.value)
      return

    await apiApi.deleteApi(projectId.value, apiId)
    await refreshTree()

    if (selectedNodeId.value === apiId) {
      clearSelection()
    }
  }

  /** 克隆 API */
  async function cloneApi(apiId: string, req: CloneApiReq) {
    if (!projectId.value)
      return null

    const api = await apiApi.cloneApi(projectId.value, apiId, req)
    await refreshTree()
    expandGroup(req.targetGroupId)

    return api
  }

  /** 移动分组 */
  async function moveGroup(groupId: string, newParentId: string | null, sortOrder?: number) {
    if (!projectId.value)
      return

    await groupApi.moveGroup(projectId.value, groupId, {
      newParentId,
      sortOrder,
    })
    await refreshTree()
  }

  /** 批量更新分组排序 */
  async function sortGroups(items: { id: string, sortOrder: number }[]) {
    if (!projectId.value)
      return

    await groupApi.sortGroups(projectId.value, { items })
    await refreshTree()
  }

  /** 批量更新 API 排序 */
  async function sortApis(items: { id: string, sortOrder: number }[]) {
    if (!projectId.value)
      return

    await apiApi.sortApis(projectId.value, { items })
    await refreshTree()
  }

  /** 移动 API 到其他分组 */
  async function moveApi(apiId: string, targetGroupId: string, sortOrder: number) {
    if (!projectId.value)
      return

    await apiApi.moveApi(projectId.value, apiId, { targetGroupId, sortOrder })
    await refreshTree()

    // 展开目标分组
    expandGroup(targetGroupId)
  }

  /** 乐观更新 - 添加 API 到分组 */
  function addApiToGroup(groupId: string, api: ApiBrief) {
    const group = findGroupInTree(tree.value, groupId)
    if (group) {
      group.apis.push(api)
      group.apiCount += 1
    }
  }

  /** 乐观更新 - 从分组移除 API */
  function removeApiFromGroup(apiId: string) {
    const group = findGroupByApiId(tree.value, apiId)
    if (group) {
      group.apis = group.apis.filter(api => api.id !== apiId)
      group.apiCount -= 1
    }
  }

  /** 根据 apiId 从 tree 中获取特定的 API */
  function getApiById(apiId: string): ApiBrief | null {
    // 迭代式 DFS：使用栈遍历，避免递归调用栈开销，也不会栈溢出
    const stack: GroupNodeWithApis[] = [...tree.value]

    while (stack.length > 0) {
      const node = stack.pop()!

      // 在当前分组的 APIs 中查找
      const target = node.apis.find(api => api.id === apiId)
      if (target) {
        return target
      }

      // 将子分组压入栈中继续搜索
      if (node.children.length > 0) {
        stack.push(...node.children)
      }
    }

    return null
  }

  /** 重置状态 */
  function reset() {
    tree.value = []
    loadingStatus.value = 'start'
    expandedKeys.value.clear()
    searchQuery.value = ''
    selectedNodeId.value = null
    selectedNodeType.value = null
  }

  return {
    // 状态
    tree,
    loadingStatus,
    projectId,
    expandedKeys,
    searchQuery,
    selectedNodeId,
    selectedNodeType,

    // 计算属性
    hasTree,
    filteredTree,

    // 方法
    setProjectId,
    fetchTree,
    refreshTree,
    toggleExpand,
    expandGroup,
    collapseGroup,
    expandAll,
    collapseAll,
    isExpanded,
    setSearchQuery,
    selectNode,
    clearSelection,
    createGroup,
    updateGroup,
    deleteGroup,
    createApi,
    deleteApi,
    cloneApi,
    moveGroup,
    moveApi,
    sortGroups,
    sortApis,
    addApiToGroup,
    removeApiFromGroup,
    findGroupInTree,
    findGroupByApiId,
    findGroupPathByApiId,
    expandGroupPath,
    getApiById,
    reset,
  }
})

export type ApiTreeStore = ReturnType<typeof useApiTreeStore>
