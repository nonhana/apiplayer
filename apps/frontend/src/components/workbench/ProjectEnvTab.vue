<script lang="ts" setup>
import type { ProjectDetail, ProjectEnv, ProjectEnvType } from '@/types/project'
import {
  Check,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { projectApi } from '@/api/project'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { TabsContent } from '@/components/ui/tabs'
import { ENV_TYPE_LABEL_MAP, ENV_TYPE_OPTIONS } from '@/constants/project'
import { useProjectStore } from '@/stores/useProjectStore'
import { createProjectEnvFormSchema } from '@/validators/project-env'

const props = defineProps<{
  project: ProjectDetail
  canEdit: boolean
}>()

const projectStore = useProjectStore()

// 环境列表 - 从 props 获取，编辑后刷新
const environments = computed(() => props.project.environments ?? [])

// 创建/编辑对话框
const isFormDialogOpen = ref(false)
const isEditing = ref(false)
const editingEnv = ref<ProjectEnv | null>(null)
const isSubmitting = ref(false)

// 删除确认对话框
const isDeleteDialogOpen = ref(false)
const envToDelete = ref<ProjectEnv | null>(null)
const isDeleting = ref(false)

// 设置默认环境
const isSettingDefault = ref(false)

// 表单
const { handleSubmit, resetForm, setValues } = useForm({
  validationSchema: createProjectEnvFormSchema,
  initialValues: {
    name: '',
    type: 'DEV' as ProjectEnvType,
    baseUrl: '',
    isDefault: false,
  },
})

/** 打开创建对话框 */
function openCreateDialog() {
  isEditing.value = false
  editingEnv.value = null
  resetForm({
    values: {
      name: '',
      type: 'DEV',
      baseUrl: '',
      isDefault: environments.value.length === 0,
    },
  })
  isFormDialogOpen.value = true
}

/** 打开编辑对话框 */
function openEditDialog(env: ProjectEnv) {
  isEditing.value = true
  editingEnv.value = env
  setValues({
    name: env.name,
    type: env.type,
    baseUrl: env.baseUrl,
    isDefault: env.isDefault,
  })
  isFormDialogOpen.value = true
}

/** 提交表单 */
const onSubmit = handleSubmit(async (formValues) => {
  isSubmitting.value = true
  try {
    if (isEditing.value && editingEnv.value) {
      // 更新环境
      await projectApi.updateProjectEnv(props.project.id, editingEnv.value.id, {
        name: formValues.name,
        type: formValues.type as ProjectEnvType,
        baseUrl: formValues.baseUrl,
        isDefault: formValues.isDefault,
      })
      toast.success('环境已更新')
    }
    else {
      // 创建环境
      await projectApi.createProjectEnv(props.project.id, {
        name: formValues.name,
        type: formValues.type as ProjectEnvType,
        baseUrl: formValues.baseUrl,
        isDefault: formValues.isDefault,
      })
      toast.success('环境已创建')
    }

    // 刷新项目数据
    await projectStore.refresh()
    isFormDialogOpen.value = false
  }
  finally {
    isSubmitting.value = false
  }
})

/** 打开删除确认 */
function openDeleteDialog(env: ProjectEnv) {
  envToDelete.value = env
  isDeleteDialogOpen.value = true
}

/** 确认删除环境 */
async function confirmDelete() {
  if (!envToDelete.value)
    return

  isDeleting.value = true
  try {
    await projectApi.deleteProjectEnv(props.project.id, envToDelete.value.id)
    toast.success('环境已删除')

    // 刷新项目数据
    await projectStore.refresh()

    isDeleteDialogOpen.value = false
    envToDelete.value = null
  }
  finally {
    isDeleting.value = false
  }
}

/** 设置为默认环境 */
async function setAsDefault(env: ProjectEnv) {
  if (env.isDefault)
    return

  isSettingDefault.value = true
  try {
    await projectStore.setDefaultEnv(env.id)
    toast.success(`已将 "${env.name}" 设为默认环境`)
  }
  catch {
    toast.error('设置默认环境失败')
  }
  finally {
    isSettingDefault.value = false
  }
}

/** 获取环境类型的样式 */
function getEnvTypeBadgeVariant(type: ProjectEnvType): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (type) {
    case 'PROD':
      return 'destructive'
    case 'STAGING':
      return 'default'
    case 'TEST':
      return 'secondary'
    default:
      return 'outline'
  }
}

// 关闭对话框时重置表单
watch(isFormDialogOpen, (open) => {
  if (!open) {
    resetForm()
    editingEnv.value = null
    isEditing.value = false
  }
})
</script>

<template>
  <TabsContent value="environments" force-mount class="flex-1 flex flex-col overflow-hidden px-6 py-4 data-[state=inactive]:hidden">
    <!-- 头部操作 -->
    <div class="flex items-center justify-between mb-4">
      <p class="text-sm text-muted-foreground">
        配置不同的运行环境，如开发、测试、生产等
      </p>
      <Button
        v-if="canEdit"
        size="sm"
        @click="openCreateDialog"
      >
        <Plus class="h-4 w-4 mr-1" />
        新建环境
      </Button>
    </div>

    <!-- 环境列表 -->
    <ScrollArea class="flex-1 -mx-6 px-6">
      <div class="space-y-3">
        <div
          v-for="env in environments"
          :key="env.id"
          class="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium truncate">{{ env.name }}</span>
                <Badge :variant="getEnvTypeBadgeVariant(env.type)" class="text-xs">
                  {{ ENV_TYPE_LABEL_MAP[env.type] }}
                </Badge>
                <Badge v-if="env.isDefault" variant="outline" class="text-xs gap-1">
                  <Star class="h-3 w-3 fill-current" />
                  默认
                </Badge>
              </div>
              <p class="text-sm text-muted-foreground truncate">
                {{ env.baseUrl }}
              </p>
            </div>

            <DropdownMenu v-if="canEdit">
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" class="h-8 w-8 shrink-0">
                  <MoreHorizontal class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  v-if="!env.isDefault"
                  :disabled="isSettingDefault"
                  @click="setAsDefault(env)"
                >
                  <Check class="h-4 w-4 mr-2" />
                  设为默认
                </DropdownMenuItem>
                <DropdownMenuItem @click="openEditDialog(env)">
                  <Pencil class="h-4 w-4 mr-2" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  class="text-destructive focus:text-destructive"
                  @click="openDeleteDialog(env)"
                >
                  <Trash2 class="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-if="environments.length === 0"
          class="py-12 text-center text-muted-foreground"
        >
          <p class="mb-2">
            暂无环境配置
          </p>
          <p class="text-xs">
            点击"新建环境"开始配置
          </p>
        </div>
      </div>
    </ScrollArea>

    <!-- 环境统计 -->
    <div class="text-xs text-muted-foreground text-center pt-4 border-t mt-4">
      共 {{ environments.length }} 个环境
    </div>

    <!-- 创建/编辑环境对话框 -->
    <Dialog v-model:open="isFormDialogOpen">
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
                  :disabled="isSubmitting || (isEditing && editingEnv?.isDefault)"
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
              @click="isFormDialogOpen = false"
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

    <!-- 删除确认对话框 -->
    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除环境</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除环境 <span class="font-medium text-foreground">"{{ envToDelete?.name }}"</span> 吗？
            此操作不可撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeleting">
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            :disabled="isDeleting"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click.prevent="confirmDelete"
          >
            <Loader2 v-if="isDeleting" class="h-4 w-4 mr-2 animate-spin" />
            确认删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </TabsContent>
</template>
