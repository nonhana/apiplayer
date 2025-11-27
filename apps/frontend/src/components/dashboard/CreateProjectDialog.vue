<script lang="ts" setup>
import type { ProjectItem } from '@/types/project'
import { Globe, Loader2, Lock } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { ref, watch } from 'vue'
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
import { createProjectFormSchema } from '@/validators/project'

const emits = defineEmits<{
  (e: 'created', project: ProjectItem): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const teamStore = useTeamStore()

const isSubmitting = ref(false)

const { handleSubmit, resetForm, setFieldValue, values } = useForm({
  validationSchema: createProjectFormSchema,
  initialValues: {
    name: '',
    slug: '',
    description: '',
    icon: '',
    isPublic: false,
  },
})

/** 根据名称自动生成 slug */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** 监听名称变化，自动生成 slug */
watch(
  () => values.name,
  (newName) => {
    if (newName) {
      setFieldValue('slug', generateSlug(newName))
    }
  },
)

/** 提交创建项目 */
const onSubmit = handleSubmit(async (formValues) => {
  if (!teamStore.currentTeamId) {
    toast.error('请先选择一个团队')
    return
  }

  isSubmitting.value = true
  try {
    const newProject = await projectApi.createProject(teamStore.currentTeamId, {
      name: formValues.name,
      slug: formValues.slug,
      description: formValues.description || undefined,
      icon: formValues.icon || undefined,
      isPublic: formValues.isPublic,
    })

    // 构建完整的项目项用于更新列表
    const projectItem: ProjectItem = {
      ...newProject,
      updatedAt: newProject.createdAt,
      memberCount: 1,
      apiCount: 0,
      team: {
        id: teamStore.currentTeamId,
        name: teamStore.currentTeam?.name ?? '',
        slug: teamStore.currentTeam?.slug ?? '',
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

    emits('created', projectItem)
    isOpen.value = false
  }
  finally {
    isSubmitting.value = false
  }
})

/** 关闭时重置表单 */
watch(isOpen, (open) => {
  if (!open) {
    resetForm()
  }
})
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>创建项目</DialogTitle>
        <DialogDescription>
          在 <span class="font-medium text-foreground">{{ teamStore.currentTeam?.name ?? '当前团队' }}</span> 中创建一个新项目
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="onSubmit">
        <!-- 项目名称 -->
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>项目名称 <span class="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input placeholder="如：用户服务 API" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <!-- 项目标识符 -->
        <FormField v-slot="{ componentField }" name="slug">
          <FormItem>
            <FormLabel>项目标识符 <span class="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input
                placeholder="如：user-service-api"
                v-bind="componentField"
              />
            </FormControl>
            <FormDescription>
              URL 友好的唯一标识符，只能包含小写字母、数字和连字符
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>
        <!-- 项目描述 -->
        <FormField v-slot="{ componentField }" name="description">
          <FormItem>
            <FormLabel>项目描述</FormLabel>
            <FormControl>
              <Textarea placeholder="简要描述您的项目..." rows="3" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- 公开/私有切换 -->
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

        <DialogFooter class="gap-2 sm:gap-0">
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
            创建项目
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
