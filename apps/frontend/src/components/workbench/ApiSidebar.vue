<script lang="ts" setup>
import type { GroupFormMode } from './dialogs/GroupFormDialog.vue'
import type { ApiBrief, GroupNodeWithApis } from '@/types/api'
import { ref } from 'vue'
import { ApiTree } from './api-tree'
import {
  ApiFormDialog,
  CloneApiDialog,
  DeleteApiDialog,
  DeleteGroupDialog,
  GroupFormDialog,
} from './dialogs'

const emits = defineEmits<{
  (e: 'selectApi', api: ApiBrief): void
}>()

// ========== 分组对话框状态 ==========
const isGroupDialogOpen = ref(false)
const groupDialogMode = ref<GroupFormMode>('create')
const groupDialogParentId = ref<string | undefined>()
const groupToRename = ref<GroupNodeWithApis | null>(null)

// ========== API 对话框状态 ==========
const isApiDialogOpen = ref(false)
const apiDialogGroupId = ref<string | undefined>()

// ========== 删除分组对话框状态 ==========
const isDeleteGroupDialogOpen = ref(false)
const groupToDelete = ref<GroupNodeWithApis | null>(null)

// ========== 删除 API 对话框状态 ==========
const isDeleteApiDialogOpen = ref(false)
const apiToDelete = ref<ApiBrief | null>(null)

// ========== 克隆 API 对话框状态 ==========
const isCloneApiDialogOpen = ref(false)
const apiToClone = ref<ApiBrief | null>(null)

// ========== 事件处理 ==========

/** 创建分组 */
function handleCreateGroup(parentId?: string) {
  groupDialogMode.value = 'create'
  groupDialogParentId.value = parentId
  groupToRename.value = null
  isGroupDialogOpen.value = true
}

/** 重命名分组 */
function handleRenameGroup(group: GroupNodeWithApis) {
  groupDialogMode.value = 'rename'
  groupDialogParentId.value = undefined
  groupToRename.value = group
  isGroupDialogOpen.value = true
}

/** 删除分组 */
function handleDeleteGroup(group: GroupNodeWithApis) {
  groupToDelete.value = group
  isDeleteGroupDialogOpen.value = true
}

/** 创建 API */
function handleCreateApi(groupId?: string) {
  apiDialogGroupId.value = groupId
  isApiDialogOpen.value = true
}

/** 选择 API */
function handleSelectApi(api: ApiBrief) {
  emits('selectApi', api)
}

/** 克隆 API */
function handleCloneApi(api: ApiBrief) {
  apiToClone.value = api
  isCloneApiDialogOpen.value = true
}

/** 删除 API */
function handleDeleteApi(api: ApiBrief) {
  apiToDelete.value = api
  isDeleteApiDialogOpen.value = true
}
</script>

<template>
  <aside class="w-64 border-r border-border flex flex-col shrink-0 bg-muted/20">
    <!-- API 树 -->
    <ApiTree
      @create-group="handleCreateGroup"
      @create-api="handleCreateApi"
      @rename-group="handleRenameGroup"
      @delete-group="handleDeleteGroup"
      @select-api="handleSelectApi"
      @clone-api="handleCloneApi"
      @delete-api="handleDeleteApi"
    />

    <!-- 分组表单对话框 -->
    <GroupFormDialog
      v-model:open="isGroupDialogOpen"
      :mode="groupDialogMode"
      :parent-id="groupDialogParentId"
      :group="groupToRename"
    />

    <!-- API 表单对话框 -->
    <ApiFormDialog
      v-model:open="isApiDialogOpen"
      :group-id="apiDialogGroupId"
    />

    <!-- 删除分组对话框 -->
    <DeleteGroupDialog
      v-model:open="isDeleteGroupDialogOpen"
      :group="groupToDelete"
    />

    <!-- 删除 API 对话框 -->
    <DeleteApiDialog
      v-model:open="isDeleteApiDialogOpen"
      :api="apiToDelete"
    />

    <!-- 克隆 API 对话框 -->
    <CloneApiDialog
      v-model:open="isCloneApiDialogOpen"
      :api="apiToClone"
    />
  </aside>
</template>
