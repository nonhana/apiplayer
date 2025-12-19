<script lang="ts" setup>
import type { ProjectEnv, ProjectEnvType } from '@/types/project'
import { Loader2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { projectApi } from '@/api/project'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ENV_TYPE_OPTIONS } from '@/constants/project'
import { createProjectEnvFormSchema } from '@/validators/project-env'

const props = defineProps<{
  /** 项目 ID */
  projectId: string
  /** 编辑模式下的环境数据，不传则为创建模式 */
  env?: ProjectEnv | null
  /** 当前环境总数，用于判断是否默认勾选"设为默认" */
  existingEnvsCount?: number
}>()

const emits = defineEmits<{
  /** 创建/编辑成功后触发 */
  (e: 'success'): void
}>()

/** 对话框开关状态 */
const open = defineModel<boolean>('open', { default: false })

/** 是否为编辑模式 */
const isEditing = computed(() => !!props.env)

/** 表单提交中状态 */
const isSubmitting = ref(false)

/** 表单实例 */
const { handleSubmit, resetForm, setValues } = useForm({
  validationSchema: createProjectEnvFormSchema,
  initialValues: {
    name: '',
    type: 'DEV' as ProjectEnvType,
    baseUrl: '',
    isDefault: false,
  },
})

/** 监听对话框打开/关闭，重置或填充表单 */
watch(open, (isOpen) => {
  if (isOpen) {
    if (props.env) {
      // 编辑模式：填充现有数据
      setValues({
        name: props.env.name,
        type: props.env.type,
        baseUrl: props.env.baseUrl,
        isDefault: props.env.isDefault,
      })
    }
    else {
      // 创建模式：重置表单，如果没有任何环境则默认勾选
      resetForm({
        values: {
          name: '',
          type: 'DEV',
          baseUrl: '',
          isDefault: (props.existingEnvsCount ?? 0) === 0,
        },
      })
    }
  }
  else {
    // 关闭时重置表单
    resetForm()
  }
})

/** 提交表单 */
const onSubmit = handleSubmit(async (formValues) => {
  isSubmitting.value = true
  try {
    const payload = {
      name: formValues.name,
      type: formValues.type as ProjectEnvType,
      baseUrl: formValues.baseUrl,
      isDefault: formValues.isDefault,
    }

    if (isEditing.value && props.env) {
      await projectApi.updateProjectEnv(props.projectId, props.env.id, payload)
      toast.success('环境已更新')
    }
    else {
      await projectApi.createProjectEnv(props.projectId, payload)
      toast.success('环境已创建')
    }

    emits('success')
    open.value = false
  }
  finally {
    isSubmitting.value = false
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ isEditing ? '编辑环境' : '新建环境' }}</DialogTitle>
        <DialogDescription>
          {{ isEditing ? '修改环境配置信息' : '创建一个新的运行环境' }}
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="onSubmit">
        <!-- 环境名称 -->
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>环境名称 <span class="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input
                placeholder="如：开发环境、测试环境"
                :disabled="isSubmitting"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- 环境类型 -->
        <FormField v-slot="{ componentField }" name="type">
          <FormItem>
            <FormLabel>环境类型 <span class="text-destructive">*</span></FormLabel>
            <Select :disabled="isSubmitting" v-bind="componentField">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="选择环境类型" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem
                  v-for="option in ENV_TYPE_OPTIONS"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- 基础 URL -->
        <FormField v-slot="{ componentField }" name="baseUrl">
          <FormItem>
            <FormLabel>基础 URL <span class="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input
                placeholder="https://api.example.com"
                :disabled="isSubmitting"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- 设为默认 -->
        <FormField v-slot="{ componentField }" type="checkbox" name="isDefault">
          <FormItem class="flex items-center justify-between rounded-lg border p-3">
            <FormLabel class="font-normal">
              设为默认环境
            </FormLabel>
            <FormControl>
              <Switch
                :disabled="isSubmitting || (isEditing && env?.isDefault)"
                v-bind="componentField"
              />
            </FormControl>
          </FormItem>
        </FormField>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            :disabled="isSubmitting"
            @click="open = false"
          >
            取消
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
            {{ isEditing ? '保存' : '创建' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
