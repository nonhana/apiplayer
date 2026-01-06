<script lang="ts" setup>
import type { GroupNodeWithApis } from '@/types/api'
import { Loader2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiTreeStore } from '@/stores/useApiTreeStore'

const props = defineProps<{
  /** 模式：create 创建 | rename 重命名 */
  mode: 'create' | 'rename'
  /** 父分组 ID（创建子分组时使用） */
  parentId?: string
  /** 要重命名的分组（重命名模式使用） */
  group?: GroupNodeWithApis | null
}>()

const emits = defineEmits<{
  (e: 'success'): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const apiTreeStore = useApiTreeStore()

/** 分组名称 */
const groupName = ref('')

/** 是否提交中 */
const isSubmitting = ref(false)

/** 对话框标题 */
const dialogTitle = computed(() =>
  props.mode === 'create' ? '新建分组' : '重命名分组',
)

/** 对话框描述 */
const dialogDescription = computed(() =>
  props.mode === 'create'
    ? '为你的 API 创建一个新的分组，方便管理和归类。'
    : '修改分组名称',
)

/** 提交按钮文字 */
const submitText = computed(() =>
  props.mode === 'create' ? '创建' : '保存',
)

/** 是否可以提交 */
const canSubmit = computed(() => groupName.value.trim().length > 0)

/** 监听对话框打开，重置表单 */
watch(isOpen, (open) => {
  if (open) {
    if (props.mode === 'rename' && props.group) {
      groupName.value = props.group.name
    }
    else {
      groupName.value = ''
    }
  }
})

/** 提交表单 */
async function handleSubmit() {
  const name = groupName.value.trim()
  if (!name)
    return

  isSubmitting.value = true

  try {
    if (props.mode === 'create') {
      await apiTreeStore.createGroup(name, props.parentId)
      toast.success('分组创建成功')
    }
    else if (props.group) {
      await apiTreeStore.updateGroup(props.group.id, name)
      toast.success('分组重命名成功')
    }

    isOpen.value = false
    emits('success')
  }
  catch (error) {
    console.error('Group operation failed:', error)
  }
  finally {
    isSubmitting.value = false
  }
}

/** 处理键盘事件 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && canSubmit.value && !isSubmitting.value) {
    handleSubmit()
  }
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription>
          {{ dialogDescription }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="group-name">分组名称</Label>
          <Input
            id="group-name"
            v-model="groupName"
            placeholder="请输入分组名称"
            :disabled="isSubmitting"
            @keydown="handleKeydown"
          />
        </div>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button
            type="button"
            variant="outline"
            :disabled="isSubmitting"
          >
            取消
          </Button>
        </DialogClose>
        <Button
          type="button"
          :disabled="!canSubmit || isSubmitting"
          @click="handleSubmit"
        >
          <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
          {{ submitText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
