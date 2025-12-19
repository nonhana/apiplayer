<script lang="ts" setup>
import type { ProjectDetail } from '@/types/project'
import { ImagePlus, Loader2, Trash2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { projectApi } from '@/api/project'
import Cropper from '@/components/Cropper.vue'
import DeleteProjectDialog from '@/components/dashboard/DeleteProjectDialog.vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { getProjectFallbackIcon } from '@/lib/utils'
import { useProjectStore } from '@/stores/useProjectStore'
import { updateProjectFormSchema } from '@/validators/project'

const props = defineProps<{
  project: ProjectDetail
  isAdmin: boolean
  canEdit: boolean
}>()

const emits = defineEmits<{
  (e: 'deleted', projectId: string): void
}>()

const router = useRouter()
const projectStore = useProjectStore()

// 项目信息编辑状态
const isUpdating = ref(false)

// 头像上传状态
const avatarInputRef = ref<HTMLInputElement | null>(null)
const cropperOpen = ref(false)
const cropperSourceUrl = ref<string | null>(null)

// 删除项目对话框
const isDeleteDialogOpen = ref(false)

// 表单
const { handleSubmit, setValues, values } = useForm({
  validationSchema: updateProjectFormSchema,
  initialValues: {
    name: '',
    description: '',
    icon: '',
    isPublic: false,
  },
})

/** 提交项目信息更新 */
const onSubmit = handleSubmit(async (formValues) => {
  if (!props.project)
    return

  isUpdating.value = true
  try {
    await projectApi.updateProject(props.project.id, {
      name: formValues.name || undefined,
      description: formValues.description || undefined,
      icon: formValues.icon || undefined,
      isPublic: formValues.isPublic,
    })

    // 刷新项目数据
    await projectStore.refresh()

    toast.success('项目信息已更新')
  }
  finally {
    isUpdating.value = false
  }
})

// 挂载时初始化表单
onMounted(() => {
  setValues({
    name: props.project.name,
    description: props.project.description ?? '',
    icon: props.project.icon ?? '',
    isPublic: props.project.isPublic,
  })
})

/** 处理头像选择 */
function handleIconSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    toast.error('请选择图片文件')
    return
  }

  // 读取文件并打开裁剪器
  const reader = new FileReader()
  reader.onload = (e) => {
    cropperSourceUrl.value = e.target?.result as string
    cropperOpen.value = true
  }
  reader.readAsDataURL(file)

  // 清空 input 以便下次选择同一文件
  input.value = ''
}

/** 裁剪确认后更新图标 */
function handleIconCropped(url: string) {
  setValues({ ...values, icon: url })
}

/** 项目删除成功后的处理 */
function handleProjectDeleted(projectId: string) {
  emits('deleted', projectId)
  // 跳转到仪表盘
  router.push({ name: 'Dashboard' })
}
</script>

<template>
  <TabsContent value="info" force-mount class="flex-1 overflow-auto px-6 py-4 data-[state=inactive]:hidden">
    <form class="space-y-6" @submit="onSubmit">
      <!-- 项目图标 -->
      <FormField name="icon">
        <FormItem>
          <FormLabel>项目图标</FormLabel>
          <FormControl>
            <div class="flex items-center gap-4">
              <Avatar class="h-20 w-20 border-2 rounded-lg">
                <AvatarImage v-if="values.icon" :src="values.icon" />
                <AvatarFallback class="text-2xl font-semibold bg-primary/10 text-primary rounded-lg">
                  {{ getProjectFallbackIcon(project.name) }}
                </AvatarFallback>
              </Avatar>
              <div class="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  :disabled="isUpdating || !canEdit"
                  @click="avatarInputRef?.click()"
                >
                  <ImagePlus class="h-4 w-4 mr-2" />
                  更换图标
                </Button>
                <p class="text-xs text-muted-foreground">
                  支持 JPG、PNG、WebP 格式
                </p>
              </div>
              <input
                ref="avatarInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleIconSelect"
              >
            </div>
          </FormControl>
        </FormItem>
      </FormField>

      <!-- 项目名称 -->
      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel>项目名称</FormLabel>
          <FormControl>
            <Input
              placeholder="输入项目名称"
              :disabled="isUpdating || !canEdit"
              v-bind="componentField"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <!-- 项目描述 -->
      <FormField v-slot="{ componentField }" name="description">
        <FormItem>
          <FormLabel>项目描述</FormLabel>
          <FormControl>
            <Textarea
              placeholder="简要描述您的项目..."
              rows="3"
              :disabled="isUpdating || !canEdit"
              v-bind="componentField"
            />
          </FormControl>
          <FormDescription>
            简短介绍项目的目标和用途
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <!-- 可见性设置 -->
      <FormField v-slot="{ componentField }" type="checkbox" name="isPublic">
        <FormItem class="flex items-center justify-between rounded-lg border p-4">
          <div class="space-y-0.5">
            <FormLabel class="text-base">
              公开项目
            </FormLabel>
            <FormDescription>
              公开项目可被所有用户查看
            </FormDescription>
          </div>
          <FormControl>
            <Switch
              :disabled="isUpdating || !canEdit"
              v-bind="componentField"
            />
          </FormControl>
        </FormItem>
      </FormField>

      <!-- 保存按钮 -->
      <div v-if="canEdit" class="flex justify-end">
        <Button type="submit" :disabled="isUpdating">
          <Loader2 v-if="isUpdating" class="h-4 w-4 mr-2 animate-spin" />
          保存更改
        </Button>
      </div>
    </form>

    <Separator class="my-6" />

    <!-- 危险操作区 -->
    <div v-if="isAdmin" class="space-y-4">
      <div>
        <h3 class="text-sm font-medium text-destructive">
          危险操作
        </h3>
        <p class="text-sm text-muted-foreground mt-1">
          以下操作不可逆，请谨慎操作
        </p>
      </div>

      <div class="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-medium">
              删除项目
            </h4>
            <p class="text-sm text-muted-foreground mt-1">
              删除项目后，所有 API、分组、版本等数据都将被删除
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            @click="isDeleteDialogOpen = true"
          >
            <Trash2 class="h-4 w-4 mr-2" />
            删除项目
          </Button>
        </div>
      </div>
    </div>

    <!-- 图标裁剪器 -->
    <Cropper
      v-model:open="cropperOpen"
      v-model:source-url="cropperSourceUrl"
      @confirm="handleIconCropped"
    />

    <!-- 删除项目确认 -->
    <DeleteProjectDialog
      v-model:open="isDeleteDialogOpen"
      :project="project"
      @deleted="handleProjectDeleted"
    />
  </TabsContent>
</template>
