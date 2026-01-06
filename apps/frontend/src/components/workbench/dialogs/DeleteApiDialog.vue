<script lang="ts" setup>
import type { ApiBrief } from '@/types/api'
import { AlertTriangle, Loader2 } from 'lucide-vue-next'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useApiTreeStore } from '@/stores/useApiTreeStore'

const props = defineProps<{
  api: ApiBrief | null
}>()

const emits = defineEmits<{
  (e: 'success'): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const apiTreeStore = useApiTreeStore()

const isDeleting = ref(false)

async function handleDelete() {
  if (!props.api)
    return

  isDeleting.value = true

  try {
    await apiTreeStore.deleteApi(props.api.id)
    toast.success('接口已删除')
    isOpen.value = false
    emits('success')
  }
  catch (error) {
    console.error('Delete API failed:', error)
  }
  finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <AlertDialog v-model:open="isOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle class="flex items-center gap-2">
          <AlertTriangle class="h-5 w-5 text-destructive" />
          删除接口
        </AlertDialogTitle>
        <AlertDialogDescription class="space-y-2">
          <span>确定要删除以下接口吗？此操作无法撤销。</span>
          <div
            v-if="api"
            class="flex items-center gap-2 mt-3 p-2 rounded-md bg-muted"
          >
            <Badge variant="outline" class="shrink-0 font-bold">
              {{ api.method }}
            </Badge>
            <span class="font-mono text-sm truncate text-foreground">
              {{ api.path }}
            </span>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isDeleting">
          取消
        </AlertDialogCancel>
        <Button
          variant="destructive"
          :disabled="isDeleting"
          @click="handleDelete"
        >
          <Loader2 v-if="isDeleting" class="mr-2 h-4 w-4 animate-spin" />
          确认删除
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
