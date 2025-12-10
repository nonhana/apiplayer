<script lang="ts" setup>
import type { TeamItem } from '@/types/team'
import { ImagePlus, Loader2, Trash2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { teamApi } from '@/api/team'
import Cropper from '@/components/Cropper.vue'
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
import { TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { getTeamFallbackIcon } from '@/lib/utils'
import { useTeamStore } from '@/stores/useTeamStore'
import { updateTeamFormSchema } from '@/validators/team'
import DeleteTeamDialog from './DeleteTeamDialog.vue'

const props = defineProps<{
  team: TeamItem
  isAdmin: boolean
  isOwner: boolean
}>()

const emits = defineEmits<{
  (e: 'deleted', teamId: string): void
}>()

const teamStore = useTeamStore()

// 团队信息编辑状态
const isUpdating = ref(false)

// 头像上传状态
const avatarInputRef = ref<HTMLInputElement | null>(null)
const cropperOpen = ref(false)
const cropperSourceUrl = ref<string | null>(null)

// 删除团队对话框
const isDeleteTeamDialogOpen = ref(false)

// 表单
const { handleSubmit, setValues, values } = useForm({
  validationSchema: updateTeamFormSchema,
  initialValues: {
    name: '',
    description: '',
    avatar: '',
  },
})

/** 提交团队信息更新 */
const onSubmit = handleSubmit(async (formValues) => {
  if (!props.team)
    return

  isUpdating.value = true
  try {
    const updatedTeam = await teamApi.updateTeam(props.team.id, {
      name: formValues.name || undefined,
      description: formValues.description || undefined,
      avatar: formValues.avatar || undefined,
    })

    // 更新 store 中的团队信息
    const teamItem: TeamItem = {
      ...props.team,
      ...updatedTeam,
    }
    teamStore.updateTeam(teamItem.id, teamItem)

    toast.success('团队信息已更新')
  }
  finally {
    isUpdating.value = false
  }
})

// 挂载时初始化表单
onMounted(() => {
  setValues({
    name: props.team.name,
    description: props.team.description ?? '',
    avatar: props.team.avatar ?? '',
  })
})

/** 处理头像选择 */
function handleAvatarSelect(event: Event) {
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

/** 裁剪确认后更新头像 */
function handleAvatarCropped(url: string) {
  setValues({ ...values, avatar: url })
}
</script>

<template>
  <TabsContent value="info" class="flex-1 overflow-auto px-6 py-4">
    <form class="space-y-6" @submit="onSubmit">
      <!-- 头像上传 -->
      <FormField name="avatar">
        <FormItem>
          <FormLabel>团队头像</FormLabel>
          <FormControl>
            <div class="flex items-center gap-4">
              <Avatar class="h-20 w-20 border-2">
                <AvatarImage v-if="values.avatar" :src="values.avatar" />
                <AvatarFallback class="text-2xl font-semibold bg-primary/10 text-primary">
                  {{ getTeamFallbackIcon(team.name) }}
                </AvatarFallback>
              </Avatar>
              <div class="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  :disabled="isUpdating || !isAdmin"
                  @click="avatarInputRef?.click()"
                >
                  <ImagePlus class="h-4 w-4 mr-2" />
                  更换头像
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
                @change="handleAvatarSelect"
              >
            </div>
          </FormControl>
        </FormItem>
      </FormField>

      <!-- 团队名称 -->
      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel>团队名称</FormLabel>
          <FormControl>
            <Input
              placeholder="输入团队名称"
              :disabled="isUpdating || !isAdmin"
              v-bind="componentField"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <!-- 团队描述 -->
      <FormField v-slot="{ componentField }" name="description">
        <FormItem>
          <FormLabel>团队描述</FormLabel>
          <FormControl>
            <Textarea
              placeholder="简要描述您的团队..."
              rows="3"
              :disabled="isUpdating || !isAdmin"
              v-bind="componentField"
            />
          </FormControl>
          <FormDescription>
            简短介绍团队的目标和职能
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <!-- 保存按钮 -->
      <div v-if="isAdmin" class="flex justify-end">
        <Button type="submit" :disabled="isUpdating">
          <Loader2 v-if="isUpdating" class="h-4 w-4 mr-2 animate-spin" />
          保存更改
        </Button>
      </div>
    </form>

    <Separator class="my-6" />

    <!-- 危险操作区 -->
    <div v-if="isOwner" class="space-y-4">
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
              删除团队
            </h4>
            <p class="text-sm text-muted-foreground mt-1">
              删除团队后，所有成员关系将被解除
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            @click="isDeleteTeamDialogOpen = true"
          >
            <Trash2 class="h-4 w-4 mr-2" />
            删除团队
          </Button>
        </div>
      </div>
    </div>

    <!-- 头像裁剪器 -->
    <Cropper
      v-model:open="cropperOpen"
      v-model:source-url="cropperSourceUrl"
      @confirm="handleAvatarCropped"
    />

    <!-- 删除团队确认 -->
    <DeleteTeamDialog
      v-model:open="isDeleteTeamDialogOpen"
      :team="team"
      @deleted="emits('deleted', $event)"
    />
  </TabsContent>
</template>
