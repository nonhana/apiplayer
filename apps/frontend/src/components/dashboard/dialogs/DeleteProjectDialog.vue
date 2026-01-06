<script lang="ts" setup>
import type { ProjectItem } from '@/types/project'
import { Loader2, Trash2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { projectApi } from '@/api/project'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps<{
  project: ProjectItem | null
}>()

const emits = defineEmits<{
  (e: 'deleted', projectId: string): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const confirmText = ref('')
const isDeleting = ref(false)

const canDelete = computed(() => confirmText.value === props.project?.name)

async function handleDelete() {
  if (!props.project || !canDelete.value) {
    return
  }

  isDeleting.value = true
  try {
    await projectApi.deleteProject(props.project.id)
    toast.success('项目已删除', {
      description: `项目 "${props.project.name}" 已被删除`,
    })
    emits('deleted', props.project.id)
    isOpen.value = false
  }
  catch (error) {
    console.error('删除项目失败', error)
  }
  finally {
    isDeleting.value = false
  }
}

/** 关闭时重置 */
watch(isOpen, (open) => {
  if (!open) {
    confirmText.value = ''
  }
})
</script>

<template>
  <AlertDialog v-model:open="isOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle class="flex items-center gap-2 text-destructive">
          <Trash2 class="h-5 w-5" />
          删除项目
        </AlertDialogTitle>
        <AlertDialogDescription class="space-y-3">
          <p>
            您确定要删除项目 <span class="font-semibold text-foreground">"{{ project?.name }}"</span> 吗？
          </p>
          <p class="text-destructive font-medium">
            此操作不可逆转。项目下的所有 API、分组、版本等数据都将被删除。
          </p>
          <div class="space-y-2 pt-2">
            <Label>请输入项目名称 <span class="font-mono font-semibold">{{ project?.name }}</span> 以确认删除：</Label>
            <Input
              v-model="confirmText"
              :placeholder="project?.name"
              :disabled="isDeleting"
            />
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isDeleting">
          取消
        </AlertDialogCancel>
        <AlertDialogAction
          :disabled="!canDelete || isDeleting"
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click.prevent="handleDelete"
        >
          <Loader2 v-if="isDeleting" class="mr-2 h-4 w-4 animate-spin" />
          确认删除
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
