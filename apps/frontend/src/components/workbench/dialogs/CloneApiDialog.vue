<script lang="ts" setup>
import type { ApiBrief, GroupNodeWithApis, HttpMethod } from '@/types/api'
import { Loader2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
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
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
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
import { cloneApiFormSchema } from '@/validators/api'

const props = defineProps<{
  api: ApiBrief | null
}>()

const emits = defineEmits<{
  (e: 'success'): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const apiTreeStore = useApiTreeStore()

const { handleSubmit, resetForm, setValues } = useForm({
  validationSchema: cloneApiFormSchema,
  initialValues: {
    targetGroupId: '',
    name: '',
    path: '',
    method: 'GET',
  },
})

const isSubmitting = ref(false)

/** 可用分组列表 */
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

function generateCloneName(originalName: string): string {
  return `${originalName} (副本)`
}

function generateClonePath(originalPath: string): string {
  // 如果路径已有后缀数字，递增；否则加 -copy
  const match = originalPath.match(/^(.+)-copy(\d*)$/)
  if (match) {
    const base = match[1]
    const num = match[2] ? Number.parseInt(match[2], 10) + 1 : 2
    return `${base}-copy${num}`
  }
  return `${originalPath}-copy`
}

watch(isOpen, (open) => {
  if (open && props.api) {
    // 默认选择当前 API 所在分组
    const group = apiTreeStore.findGroupByApiId(apiTreeStore.tree, props.api.id)
    const targetGroupId = group?.id ?? flatGroups.value[0]?.id ?? ''

    // 预填充
    setValues({
      targetGroupId,
      name: generateCloneName(props.api.name),
      path: generateClonePath(props.api.path),
      method: props.api.method,
    })
  }
  else if (!open) {
    resetForm()
  }
})

const onSubmit = handleSubmit(async (formValues) => {
  if (!props.api)
    return

  isSubmitting.value = true

  try {
    await apiTreeStore.cloneApi(props.api.id, {
      targetGroupId: formValues.targetGroupId,
      name: formValues.name.trim(),
      path: formValues.path.trim(),
      method: formValues.method,
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
})

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

      <form class="space-y-4 py-4" @submit="onSubmit">
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

        <FormField v-slot="{ componentField }" name="targetGroupId">
          <FormItem>
            <FormLabel>目标分组</FormLabel>
            <FormControl>
              <Select :disabled="isSubmitting" v-bind="componentField">
                <SelectTrigger>
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
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>接口名称</FormLabel>
            <FormControl>
              <Input
                placeholder="输入新接口名称"
                :disabled="isSubmitting"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <div class="grid grid-cols-[100px_1fr] gap-2">
          <FormField v-slot="{ componentField, value }" name="method">
            <FormItem>
              <FormLabel>方法</FormLabel>
              <FormControl>
                <Select :disabled="isSubmitting" v-bind="componentField">
                  <SelectTrigger>
                    <SelectValue>
                      <span :class="cn('font-bold', methodColors[value as HttpMethod])">
                        {{ value }}
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
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="path">
            <FormItem>
              <FormLabel>路径</FormLabel>
              <FormControl>
                <Input
                  placeholder="输入新接口路径"
                  class="font-mono"
                  :disabled="isSubmitting"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <p class="text-xs text-muted-foreground">
          同一项目中，相同路径和方法的接口不能重复。
        </p>

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
            type="submit"
            :disabled="isSubmitting"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            克隆
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
