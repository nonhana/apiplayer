<script lang="ts" setup>
import type { ApiBrief, GroupNodeWithApis } from '@/types/api'
import { ref } from 'vue'
import { useTabStore } from '@/stores/useTabStore'
import ApiTree from './api-tree/ApiTree.vue'
import ApiFormDialog from './dialogs/ApiFormDialog.vue'
import CloneApiDialog from './dialogs/CloneApiDialog.vue'
import DeleteApiDialog from './dialogs/DeleteApiDialog.vue'
import DeleteGroupDialog from './dialogs/DeleteGroupDialog.vue'
import GroupFormDialog from './dialogs/GroupFormDialog.vue'

const tabStore = useTabStore()

const isGroupDialogOpen = ref(false)
const groupDialogMode = ref<'create' | 'rename'>('create')
const groupDialogParentId = ref<string>()
const groupToRename = ref<GroupNodeWithApis | null>(null)

const isApiDialogOpen = ref(false)
const apiDialogGroupId = ref<string>()

const isDeleteGroupDialogOpen = ref(false)
const groupToDelete = ref<GroupNodeWithApis | null>(null)

const isDeleteApiDialogOpen = ref(false)
const apiToDelete = ref<ApiBrief | null>(null)

const isCloneApiDialogOpen = ref(false)
const apiToClone = ref<ApiBrief | null>(null)

function handleCreateGroup(parentId?: string) {
  groupDialogMode.value = 'create'
  groupDialogParentId.value = parentId
  groupToRename.value = null
  isGroupDialogOpen.value = true
}

function handleRenameGroup(group: GroupNodeWithApis) {
  groupDialogMode.value = 'rename'
  groupDialogParentId.value = undefined
  groupToRename.value = group
  isGroupDialogOpen.value = true
}

function handleDeleteGroup(group: GroupNodeWithApis) {
  groupToDelete.value = group
  isDeleteGroupDialogOpen.value = true
}

function handleCreateApi(groupId?: string) {
  apiDialogGroupId.value = groupId
  isApiDialogOpen.value = true
}

function handleSelectApi(api: ApiBrief) {
  tabStore.addTab({
    id: api.id,
    type: 'api',
    title: api.name,
    method: api.method,
    path: api.path,
  })
}

function handleCloneApi(api: ApiBrief) {
  apiToClone.value = api
  isCloneApiDialogOpen.value = true
}

function handleDeleteApi(api: ApiBrief) {
  apiToDelete.value = api
  isDeleteApiDialogOpen.value = true
}
</script>

<template>
  <aside class="w-64 border-r border-border flex flex-col shrink-0 bg-muted/20">
    <ApiTree
      @create-group="handleCreateGroup"
      @create-api="handleCreateApi"
      @rename-group="handleRenameGroup"
      @delete-group="handleDeleteGroup"
      @select-api="handleSelectApi"
      @clone-api="handleCloneApi"
      @delete-api="handleDeleteApi"
    />

    <GroupFormDialog
      v-model:open="isGroupDialogOpen"
      :mode="groupDialogMode"
      :parent-id="groupDialogParentId"
      :group="groupToRename"
    />

    <ApiFormDialog
      v-model:open="isApiDialogOpen"
      :group-id="apiDialogGroupId"
    />

    <DeleteGroupDialog
      v-model:open="isDeleteGroupDialogOpen"
      :group="groupToDelete"
    />

    <DeleteApiDialog
      v-model:open="isDeleteApiDialogOpen"
      :api="apiToDelete"
    />

    <CloneApiDialog
      v-model:open="isCloneApiDialogOpen"
      :api="apiToClone"
    />
  </aside>
</template>
