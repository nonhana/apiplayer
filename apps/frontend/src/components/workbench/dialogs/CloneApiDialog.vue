<script lang="ts" setup>
import type { ApiBrief, GroupNodeWithApis } from '@/types/api'
import { Loader2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useApiTreeStore } from '@/stores/useApiTreeStore'

const props = defineProps<{
  /** 要克隆的 API */
  api: ApiBrief | null
}>()

const emits = defineEmits<{
  (e: 'success'): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const apiTreeStore = useApiTreeStore()

/** 目标分组 ID */
const targetGroupId = ref('')

/** 是否提交中 */
const isSubmitting = ref(false)

/** 可用分组列表（扁平化） */
const flatGroups = computed(() => {
  const result: { id: string, name: string, level: number }[] = []

  function traverse(nodes: GroupNodeWithApis[], level: number) {
    for (const node of nodes) {
      result.push({ id: node.id, name: node.name, level })
      traverse(node.children, level + 1)
    }
  }

  traverse(apiTreeStore.tree, 0)
  return result
})

/** 是否可以提交 */
const canSubmit = computed(() => targetGroupId.value.length > 0)

/** 监听对话框打开，重置表单 */
watch(isOpen, (open) => {
  if (open && props.api) {
    // 默认选择当前 API 所在分组
    const group = apiTreeStore.findGroupByApiId(apiTreeStore.tree, props.api.id)
    targetGroupId.value = group?.id ?? flatGroups.value[0]?.id ?? ''
  }
})

/** 提交表单 */
async function handleSubmit() {
  if (!props.api || !canSubmit.value)
    return

  isSubmitting.value = true

  try {
    await apiTreeStore.cloneApi(props.api.id, targetGroupId.value)
    toast.success('接口克隆成功')
    isOpen.value = false
    emits('success')
  }
  catch (error) {
    console.error('Clone API failed:', error)
  }
  finally {
    isSubmitting.value = false
  }
}

/** 获取分组显示名（带缩进） */
function getGroupDisplayName(group: { name: string, level: number }) {
  return '  '.repeat(group.level) + group.name
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>克隆接口</DialogTitle>
        <DialogDescription>
          选择目标分组，将接口复制到该分组下。
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- 源接口信息 -->
        <div
          v-if="api"
          class="flex items-center gap-2 p-3 rounded-md bg-muted"
        >
          <Badge variant="outline" class="shrink-0 font-bold">
            {{ api.method }}
          </Badge>
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">
              {{ api.name }}
            </p>
            <p class="text-xs text-muted-foreground font-mono truncate">
              {{ api.path }}
            </p>
          </div>
        </div>

        <!-- 目标分组 -->
        <div class="space-y-2">
          <Label for="target-group">目标分组</Label>
          <Select v-model="targetGroupId" :disabled="isSubmitting">
            <SelectTrigger id="target-group">
              <SelectValue placeholder="选择分组" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="group in flatGroups"
                :key="group.id"
                :value="group.id"
              >
                {{ getGroupDisplayName(group) }}
              </SelectItem>
            </SelectContent>
          </Select>
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
          克隆
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
