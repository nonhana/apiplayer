<script lang="ts" setup>
import type { ApiVersionBrief, PublishVersionReq } from '@/types/version'
import { Loader2, Rocket } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
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
import { Textarea } from '@/components/ui/textarea'
import dayjs from '@/lib/dayjs'
import { publishVersionFormSchema } from '@/validators/api'

const props = defineProps<{
  /** 要发布的版本 */
  version: ApiVersionBrief | null
  /** 建议的下一个版本号 */
  suggestedVersion?: string
}>()

const emits = defineEmits<{
  (e: 'confirm', data: PublishVersionReq): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const isSubmitting = ref(false)

const { handleSubmit, resetForm, setValues } = useForm({
  validationSchema: publishVersionFormSchema,
  initialValues: {
    version: 'v1.0.0',
    summary: '',
    changelog: '',
  },
})

/** 格式化时间 */
const createdTime = computed(() => {
  if (!props.version)
    return ''
  return dayjs(props.version.createdAt).format('YYYY-MM-DD HH:mm')
})

/** 提交发布 */
const onSubmit = handleSubmit((formValues) => {
  isSubmitting.value = true
  emits('confirm', {
    version: formValues.version,
    summary: formValues.summary || undefined,
    changelog: formValues.changelog || undefined,
  })
})

/** 完成提交后的回调 */
function finishSubmit() {
  isSubmitting.value = false
}

/** 监听对话框打开，初始化表单 */
watch(isOpen, (open) => {
  if (open) {
    setValues({
      version: props.suggestedVersion || 'v1.0.0',
      summary: props.version?.summary || '',
      changelog: props.version?.changelog || '',
    })
    isSubmitting.value = false
  }
  else {
    resetForm()
  }
})

defineExpose({
  finishSubmit,
})
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Rocket class="h-5 w-5 text-primary" />
          发布版本
        </DialogTitle>
        <DialogDescription>
          请填写版本号以发布当前修订。发布后，此版本将成为当前正式版本。
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4 py-4" @submit="onSubmit">
        <!-- 当前修订信息 -->
        <div
          v-if="version"
          class="p-4 rounded-lg border bg-muted/50 space-y-2"
        >
          <div class="flex items-center gap-2 text-sm">
            <span class="text-muted-foreground">修订号:</span>
            <Badge variant="outline" class="font-mono">
              #{{ version.revision }}
            </Badge>
          </div>
          <p
            v-if="version.summary"
            class="text-sm text-muted-foreground"
          >
            {{ version.summary }}
          </p>
          <p class="text-xs text-muted-foreground">
            创建于 {{ createdTime }}
          </p>
        </div>

        <!-- 版本号输入 -->
        <FormField v-slot="{ componentField }" name="version">
          <FormItem>
            <FormLabel>版本号 <span class="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input
                placeholder="如 v1.0.0"
                :disabled="isSubmitting"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
            <p class="text-xs text-muted-foreground">
              建议使用语义化版本号（Semantic Versioning）
            </p>
          </FormItem>
        </FormField>

        <!-- 版本摘要 -->
        <FormField v-slot="{ componentField }" name="summary">
          <FormItem>
            <FormLabel>版本摘要</FormLabel>
            <FormControl>
              <Input
                placeholder="简要描述此版本的主要变更"
                :disabled="isSubmitting"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- 变更日志 -->
        <FormField v-slot="{ componentField }" name="changelog">
          <FormItem>
            <FormLabel>变更日志</FormLabel>
            <FormControl>
              <Textarea
                placeholder="详细描述此版本的变更内容..."
                :rows="4"
                :disabled="isSubmitting"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            :disabled="isSubmitting"
            @click="isOpen = false"
          >
            取消
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
            <Rocket v-else class="h-4 w-4 mr-2" />
            {{ isSubmitting ? '发布中...' : '确认发布' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
