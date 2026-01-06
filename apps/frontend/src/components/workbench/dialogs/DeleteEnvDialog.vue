<script lang="ts" setup>
import type { ProjectEnv } from '@/types/project'
import { Loader2 } from 'lucide-vue-next'
import { ref } from 'vue'
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

const props = defineProps<{
  projectId: string
  env: ProjectEnv | null
}>()

const emits = defineEmits<{
  (e: 'success'): void
}>()

const open = defineModel<boolean>('open', { default: false })

const isDeleting = ref(false)

async function confirmDelete() {
  if (!props.env)
    return

  isDeleting.value = true
  try {
    await projectApi.deleteProjectEnv(props.projectId, props.env.id)
    toast.success('环境已删除')

    emits('success')
    open.value = false
  }
  catch (error) {
    console.error('删除环境失败', error)
  }
  finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>删除环境</AlertDialogTitle>
        <AlertDialogDescription>
          确定要删除环境 <span class="font-medium text-foreground">"{{ env?.name }}"</span> 吗？
          此操作不可撤销。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isDeleting">
          取消
        </AlertDialogCancel>
        <AlertDialogAction
          :disabled="isDeleting"
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click.prevent="confirmDelete"
        >
          <Loader2 v-if="isDeleting" class="h-4 w-4 mr-2 animate-spin" />
          确认删除
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
