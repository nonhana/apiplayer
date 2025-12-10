<script lang="ts" setup>
import type { GroupNodeWithApis } from '@/types/api'
import { AlertTriangle, Loader2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useApiTreeStore } from '@/stores/useApiTreeStore'

const props = defineProps<{
  /** 要删除的分组 */
  group: GroupNodeWithApis | null
}>()

const emits = defineEmits<{
  (e: 'success'): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const apiTreeStore = useApiTreeStore()

/** 是否级联删除 */
const cascade = ref(false)

/** 是否删除中 */
const isDeleting = ref(false)

/** 是否有子内容 */
const hasChildren = computed(() =>
  (props.group?.children.length ?? 0) > 0 || (props.group?.apiCount ?? 0) > 0,
)

/** 执行删除 */
async function handleDelete() {
  if (!props.group)
    return

  isDeleting.value = true

  try {
    await apiTreeStore.deleteGroup(props.group.id, cascade.value)
    toast.success('分组已删除')
    isOpen.value = false
    cascade.value = false
    emits('success')
  }
  catch (error) {
    console.error('Delete group failed:', error)
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
          删除分组
        </AlertDialogTitle>
        <AlertDialogDescription>
          确定要删除分组「<span class="font-semibold text-foreground">{{ group?.name }}</span>」吗？此操作无法撤销。
        </AlertDialogDescription>
      </AlertDialogHeader>

      <!-- 级联删除选项 -->
      <div v-if="hasChildren" class="flex items-start space-x-3 py-4">
        <Checkbox
          id="cascade"
          v-model:checked="cascade"
          :disabled="isDeleting"
        />
        <div class="space-y-1">
          <Label
            for="cascade"
            class="text-sm font-medium leading-none cursor-pointer"
          >
            同时删除子分组和接口
          </Label>
          <p class="text-xs text-muted-foreground">
            该分组包含 {{ group?.children.length ?? 0 }} 个子分组和 {{ group?.apiCount ?? 0 }} 个接口
          </p>
        </div>
      </div>

      <!-- 非级联删除提示 -->
      <div
        v-if="hasChildren && !cascade"
        class="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"
      >
        分组包含子分组或接口，如不勾选级联删除将无法删除。
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isDeleting">
          取消
        </AlertDialogCancel>
        <Button
          variant="destructive"
          :disabled="isDeleting || (hasChildren && !cascade)"
          @click="handleDelete"
        >
          <Loader2 v-if="isDeleting" class="mr-2 h-4 w-4 animate-spin" />
          确认删除
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
