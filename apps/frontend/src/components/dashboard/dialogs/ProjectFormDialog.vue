<script lang="ts" setup>
import type { ProjectItem, UpdateProjectReq } from '@/types/project'
import type { ProjectFormValues } from '@/validators/project'
import { Globe, Loader2, Lock } from 'lucide-vue-next'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useTeamStore } from '@/stores/useTeamStore'
import { projectFormSchema } from '@/validators/project'

const props = withDefaults(defineProps<{
  mode?: 'create' | 'edit'
  project?: ProjectItem | null
}>(), {
  mode: 'create',
  project: null,
})

const emits = defineEmits<{
  (e: 'success', project: ProjectItem): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const teamStore = useTeamStore()
const isSubmitting = ref(false)

const isCreateMode = computed(() => props.mode === 'create')
const dialogTitle = computed(() => isCreateMode.value ? '创建项目' : '编辑项目')
const dialogDescription = computed(() => {
  if (isCreateMode.value) {
    return `在 ${teamStore.curTeam?.name ?? '当前团队'} 中创建一个新项目`
  }
  return `修改项目 ${props.project?.name ?? ''} 的基本信息`
})

const submitButtonText = computed(() => isCreateMode.value ? '创建项目' : '保存更改')

const { handleSubmit, resetForm, setFieldValue, setValues, values } = useForm<ProjectFormValues>({
  validationSchema: projectFormSchema,
  initialValues: {
    name: '',
    slug: '',
    description: '',
    icon: '',
    isPublic: false,
  },
})

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** 监听名称变化，自动生成 slug（仅创建模式） */
watch(
  () => values.name,
  (newV) => {
    if (isCreateMode.value && newV) {
      setFieldValue('slug', generateSlug(newV))
    }
  },
)

/** 编辑模式下，当项目变化时填充表单 */
watch(
  () => props.project,
  (newV) => {
    if (!isCreateMode.value && newV) {
      setValues({
        name: newV.name,
        slug: newV.slug,
        description: newV.description ?? '',
        icon: newV.icon ?? '',
        isPublic: newV.isPublic,
      })
    }
  },
  { immediate: true },
)

/** 提交表单 */
const onSubmit = handleSubmit(async (formValues) => {
  isSubmitting.value = true

  try {
    let projectItem: ProjectItem

    if (isCreateMode.value) {
      // 创建模式
      if (!teamStore.curTeamId) {
        toast.error('创建项目时请指定一个团队')
        return
      }

      const newProject = await projectApi.createProject(teamStore.curTeamId, {
        name: formValues.name,
        slug: formValues.slug,
        description: formValues.description || undefined,
        icon: formValues.icon || undefined,
        isPublic: formValues.isPublic,
      })

      projectItem = {
        ...newProject,
        updatedAt: newProject.createdAt,
        memberCount: 1,
        apiCount: 0,
        team: {
          id: teamStore.curTeamId,
          name: teamStore.curTeam?.name ?? '',
          slug: teamStore.curTeam?.slug ?? '',
        },
        currentUserRole: {
          id: 'project:admin',
          name: 'project:admin',
          description: '项目管理员',
        },
      }

      toast.success('项目创建成功', {
        description: `项目 "${newProject.name}" 已创建`,
      })
    }
    else {
      // 编辑模式
      if (!props.project)
        return

      const updateData: UpdateProjectReq = {}

      // 只提交变化的字段
      if (formValues.name !== props.project.name) {
        updateData.name = formValues.name
      }
      if (formValues.description !== (props.project.description ?? '')) {
        updateData.description = formValues.description || undefined
      }
      if (formValues.icon !== (props.project.icon ?? '')) {
        updateData.icon = formValues.icon || undefined
      }
      if (formValues.isPublic !== props.project.isPublic) {
        updateData.isPublic = formValues.isPublic
      }

      // 如果没有变化，直接关闭
      if (Object.keys(updateData).length === 0) {
        isOpen.value = false
        return
      }

      const updatedProject = await projectApi.updateProject(props.project.id, updateData)

      projectItem = {
        ...props.project,
        ...updatedProject,
        updatedAt: new Date().toISOString(),
      }

      toast.success('项目更新成功')
    }

    emits('success', projectItem)
    isOpen.value = false
  }
  catch (error) {
    console.error(`${isCreateMode.value ? '创建' : '更新'}项目失败`, error)
  }
  finally {
    isSubmitting.value = false
  }
})

watch(isOpen, (open) => {
  if (!open) {
    resetForm()
  }
})
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-120">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription>
          <span v-html="dialogDescription" />
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>项目名称 <span class="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input placeholder="如：用户服务 API" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-if="isCreateMode" v-slot="{ componentField }" name="slug">
          <FormItem>
            <FormLabel>项目标识符 <span class="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input placeholder="如：user-service-api" v-bind="componentField" />
            </FormControl>
            <FormDescription>
              URL 友好的唯一标识符，只能包含小写字母、数字和连字符
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="description">
          <FormItem>
            <FormLabel>项目描述</FormLabel>
            <FormControl>
              <Textarea placeholder="简要描述您的项目..." rows="3" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <div class="flex items-center justify-between rounded-lg border p-4">
          <div class="space-y-0.5">
            <Label class="text-base flex items-center gap-2">
              <Globe v-if="values.isPublic" class="h-4 w-4 text-green-600" />
              <Lock v-else class="h-4 w-4 text-muted-foreground" />
              {{ values.isPublic ? '公开项目' : '私有项目' }}
            </Label>
            <p class="text-sm text-muted-foreground">
              {{ values.isPublic ? '所有人都可以查看此项目的 API 文档' : '仅项目成员可以访问' }}
            </p>
          </div>
          <FormField v-slot="{ componentField }" type="checkbox" name="isPublic">
            <FormItem>
              <FormControl>
                <Switch v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <DialogFooter class="gap-0 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            :disabled="isSubmitting"
            @click="isOpen = false"
          >
            取消
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            {{ submitButtonText }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
