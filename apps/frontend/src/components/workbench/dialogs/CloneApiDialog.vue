<script lang="ts" setup>
import type { ApiBrief, GroupNodeWithApis, HttpMethod } from '@/types/api'
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
import { Input } from '@/components/ui/input'
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

/** 新 API 名称 */
const newName = ref('')

/** 新 API 路径 */
const newPath = ref('')

/** 新 API 方法 */
const newMethod = ref<HttpMethod>('GET')

/** 是否提交中 */
const isSubmitting = ref(false)

/** HTTP 方法列表 */
const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

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

/** 是否可以提交（目标分组、名称、路径都要有效） */
const canSubmit = computed(() =>
  targetGroupId.value.length > 0
  && newName.value.trim().length > 0
  && newPath.value.trim().length > 0,
)

/** 生成默认的克隆名称 */
function generateCloneName(originalName: string): string {
  return `${originalName} (副本)`
}

/** 生成默认的克隆路径 */
function generateClonePath(originalPath: string): string {
  // 如果路径已有后缀数字，递增它；否则加 -copy
  const match = originalPath.match(/^(.+)-copy(\d*)$/)
  if (match) {
    const base = match[1]
    const num = match[2] ? Number.parseInt(match[2], 10) + 1 : 2
    return `${base}-copy${num}`
  }
  return `${originalPath}-copy`
}

/** 监听对话框打开，重置表单 */
watch(isOpen, (open) => {
  if (open && props.api) {
    // 默认选择当前 API 所在分组
    const group = apiTreeStore.findGroupByApiId(apiTreeStore.tree, props.api.id)
    targetGroupId.value = group?.id ?? flatGroups.value[0]?.id ?? ''

    // 预填充克隆信息
    newName.value = generateCloneName(props.api.name)
    newPath.value = generateClonePath(props.api.path)
    newMethod.value = props.api.method
  }
})

/** 提交表单 */
async function handleSubmit() {
  if (!props.api || !canSubmit.value)
    return

  isSubmitting.value = true

  try {
    await apiTreeStore.cloneApi(props.api.id, {
      targetGroupId: targetGroupId.value,
      name: newName.value.trim(),
      path: newPath.value.trim(),
      method: newMethod.value,
    })
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
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>克隆接口</DialogTitle>
        <DialogDescription>
          将接口复制到目标分组，可自定义新接口的名称、路径和方法。
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

        <!-- 新接口名称 -->
        <div class="space-y-2">
          <Label for="new-name">接口名称</Label>
          <Input
            id="new-name"
            v-model="newName"
            placeholder="输入新接口名称"
            :disabled="isSubmitting"
          />
        </div>

        <!-- 新接口路径和方法 -->
        <div class="grid grid-cols-[100px_1fr] gap-2">
          <div class="space-y-2">
            <Label for="new-method">方法</Label>
            <Select v-model="newMethod" :disabled="isSubmitting">
              <SelectTrigger id="new-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="method in HTTP_METHODS"
                  :key="method"
                  :value="method"
                >
                  {{ method }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="new-path">路径</Label>
            <Input
              id="new-path"
              v-model="newPath"
              placeholder="输入新接口路径"
              class="font-mono"
              :disabled="isSubmitting"
            />
          </div>
        </div>

        <!-- 提示信息 -->
        <p class="text-xs text-muted-foreground">
          同一项目中，相同路径和方法的接口不能重复。
        </p>
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
