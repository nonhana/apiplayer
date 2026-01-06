<script lang="ts" setup>
import type { GroupNodeWithApis, HttpMethod } from '@/types/api'
import { Loader2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
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
import { createApiFormSchema } from '@/validators/api'

const props = defineProps<{
  groupId?: string
}>()

const emits = defineEmits<{
  (e: 'success'): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const apiTreeStore = useApiTreeStore()

const { handleSubmit, resetForm, setFieldValue } = useForm({
  validationSchema: createApiFormSchema,
  initialValues: {
    name: '',
    path: '',
    method: 'GET',
    groupId: '',
  },
})

const isSubmitting = ref(false)

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

watch(isOpen, (open) => {
  if (!open) {
    resetForm()
  }
})

watch(() => props.groupId, (id) => {
  if (id) {
    setFieldValue('groupId', id)
  }
})

const onSubmit = handleSubmit(async (formValues) => {
  isSubmitting.value = true
  try {
    await apiTreeStore.createApi(
      formValues.groupId,
      formValues.name.trim(),
      formValues.path.trim(),
      formValues.method,
    )

    toast.success('接口创建成功')
    isOpen.value = false
    emits('success')
  }
  catch (error) {
    console.error('接口创建失败', error)
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
        <DialogTitle>新建接口</DialogTitle>
        <DialogDescription>
          快速创建一个新的 API 接口，之后可以在编辑器中完善详细信息。
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4 py-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="groupId">
          <FormItem>
            <FormLabel for="api-group">
              所属分组
            </FormLabel>
            <FormControl>
              <Select :disabled="isSubmitting" v-bind="componentField">
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
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel for="api-name">
              接口名称
            </FormLabel>
            <FormControl>
              <Input
                id="api-name"
                placeholder="请输入接口名称"
                :disabled="isSubmitting"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField, value }" name="method">
          <FormItem>
            <FormLabel>请求方法</FormLabel>
            <FormControl>
              <Select v-bind="componentField" :disabled="isSubmitting">
                <SelectTrigger class="w-28">
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
            <FormLabel>请求路径</FormLabel>
            <FormControl>
              <Input
                v-bind="componentField"
                placeholder="/api/example"
                class="flex-1 font-mono"
                :disabled="isSubmitting"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

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
            @click="handleSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            创建
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
