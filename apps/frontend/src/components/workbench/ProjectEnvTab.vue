<script lang="ts" setup>
import type { ProjectEnv } from '@/types/project'
import { Plus } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TabsContent } from '@/components/ui/tabs'
import { useProjectStore } from '@/stores/useProjectStore'
import CreateEnvDialog from './dialogs/CreateEnvDialog.vue'
import DeleteEnvDialog from './dialogs/DeleteEnvDialog.vue'
import ProjectEnvItem from './ProjectEnvItem.vue'

defineProps<{
  canEdit: boolean
}>()

const projectStore = useProjectStore()
const { projectId, environments } = storeToRefs(projectStore)

const isFormDialogOpen = ref(false)
const editingEnv = ref<ProjectEnv | null>(null)

const isDeleteDialogOpen = ref(false)
const envToDelete = ref<ProjectEnv | null>(null)

function openCreateDialog() {
  editingEnv.value = null
  isFormDialogOpen.value = true
}

function openEditDialog(env: ProjectEnv) {
  editingEnv.value = env
  isFormDialogOpen.value = true
}

function openDeleteDialog(env: ProjectEnv) {
  envToDelete.value = env
  isDeleteDialogOpen.value = true
}

async function handleSuccess() {
  await projectStore.refresh()
}
</script>

<template>
  <TabsContent value="environments" force-mount class="flex-1 flex flex-col overflow-hidden px-6 py-4 data-[state=inactive]:hidden">
    <div class="flex items-center justify-between mb-4">
      <p class="text-sm text-muted-foreground">
        配置不同的运行环境，如开发、测试、生产等
      </p>
      <Button
        v-if="canEdit"
        size="sm"
        @click="openCreateDialog"
      >
        <Plus class="h-4 w-4 mr-1" />
        新建环境
      </Button>
    </div>

    <ScrollArea class="flex-1 -mx-6 px-6">
      <div class="space-y-3">
        <ProjectEnvItem
          v-for="env in environments"
          :key="env.id"
          :env="env"
          :can-edit="canEdit"
          @edit="openEditDialog"
          @delete="openDeleteDialog"
        />

        <div
          v-if="environments.length === 0"
          class="py-12 text-center text-muted-foreground"
        >
          <p class="mb-2">
            暂无环境配置
          </p>
          <p class="text-xs">
            点击"新建环境"开始配置
          </p>
        </div>
      </div>
    </ScrollArea>

    <div class="text-xs text-muted-foreground text-center pt-4 border-t mt-4">
      共 {{ environments.length }} 个环境
    </div>

    <CreateEnvDialog
      v-model:open="isFormDialogOpen"
      :project-id="projectId"
      :env="editingEnv"
      :existing-envs-count="environments.length"
      @success="handleSuccess"
    />

    <DeleteEnvDialog
      v-model:open="isDeleteDialogOpen"
      :project-id="projectId"
      :env="envToDelete"
      @success="handleSuccess"
    />
  </TabsContent>
</template>
