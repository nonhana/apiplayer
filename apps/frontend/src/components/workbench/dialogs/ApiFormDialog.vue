<script lang="ts" setup>
import type { GroupNodeWithApis, HttpMethod } from '@/types/api'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HTTP_METHODS, methodColors } from '@/constants/api'
import { cn } from '@/lib/utils'
import { useApiTreeStore } from '@/stores/useApiTreeStore'

const props = defineProps<{
  /** 预选的分组 ID */
  groupId?: string
}>()

const emits = defineEmits<{
  (e: 'success'): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const apiTreeStore = useApiTreeStore()

/** 表单数据 */
const formData = ref({
  name: '',
  path: '',
  method: 'GET' as HttpMethod,
  groupId: '',
})

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
const canSubmit = computed(() =>
  formData.value.name.trim().length > 0
  && formData.value.path.trim().length > 0
  && formData.value.groupId.length > 0,
)

/** 监听对话框打开，重置表单 */
watch(isOpen, (open) => {
  if (open) {
    formData.value = {
      name: '',
      path: '/',
      method: 'GET',
      groupId: props.groupId ?? flatGroups.value[0]?.id ?? '',
    }
  }
})

/** 监听 groupId prop 变化 */
watch(() => props.groupId, (id) => {
  if (id) {
    formData.value.groupId = id
  }
})

/** 提交表单 */
async function handleSubmit() {
  if (!canSubmit.value)
    return

  isSubmitting.value = true

  try {
    await apiTreeStore.createApi(
      formData.value.groupId,
      formData.value.name.trim(),
      formData.value.path.trim(),
      formData.value.method,
    )

    toast.success('接口创建成功')
    isOpen.value = false
    emits('success')
  }
  catch (error) {
    console.error('Create API failed:', error)
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
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>新建接口</DialogTitle>
        <DialogDescription>
          快速创建一个新的 API 接口，之后可以在编辑器中完善详细信息。
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- 所属分组 -->
        <div class="space-y-2">
          <Label for="api-group">所属分组</Label>
          <Select v-model="formData.groupId" :disabled="isSubmitting">
            <SelectTrigger id="api-group">
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

        <!-- 接口名称 -->
        <div class="space-y-2">
          <Label for="api-name">接口名称</Label>
          <Input
            id="api-name"
            v-model="formData.name"
            placeholder="请输入接口名称"
            :disabled="isSubmitting"
          />
        </div>

        <!-- HTTP 方法 + 路径 -->
        <div class="space-y-2">
          <Label>请求方法 & 路径</Label>
          <div class="flex gap-2">
            <Select v-model="formData.method" :disabled="isSubmitting">
              <SelectTrigger class="w-28">
                <SelectValue>
                  <span :class="cn('font-bold', methodColors[formData.method])">
                    {{ formData.method }}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="method in HTTP_METHODS"
                  :key="method"
                  :value="method"
                >
                  <span :class="cn('font-bold', methodColors[method])">
                    {{ method }}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              v-model="formData.path"
              placeholder="/api/example"
              class="flex-1 font-mono"
              :disabled="isSubmitting"
            />
          </div>
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
          创建
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
