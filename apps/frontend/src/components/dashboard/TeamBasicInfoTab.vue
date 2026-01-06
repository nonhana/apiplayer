<script lang="ts" setup>
import type { TeamItem } from '@/types/team'
import { ImagePlus, Loader2, Trash2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { teamApi } from '@/api/team'
import { utilApi } from '@/api/util'
import ImageCropper from '@/components/common/ImageCropper.vue'
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
import { getAbbreviation } from '@/lib/utils'
import { useTeamStore } from '@/stores/useTeamStore'
import { updateTeamFormSchema } from '@/validators/team'
import DeleteTeamDialog from './dialogs/DeleteTeamDialog.vue'

const props = defineProps<{
  team: TeamItem
  isAdmin: boolean
  isOwner: boolean
}>()

const emits = defineEmits<{
  (e: 'deleted', teamId: string): void
}>()

const teamStore = useTeamStore()

const isUpdating = ref(false)

const isDeleteTeamDialogOpen = ref(false)

const { handleSubmit, setValues, values } = useForm({
  validationSchema: updateTeamFormSchema,
  initialValues: {
    name: '',
    description: '',
    avatar: '',
  },
})

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

    const teamItem: TeamItem = {
      ...props.team,
      ...updatedTeam,
    }
    teamStore.updateTeam(teamItem.id, teamItem)

    toast.success('团队信息已更新')
  }
  catch (error) {
    console.error('更新团队信息失败', error)
  }
  finally {
    isUpdating.value = false
  }
})

const isUploading = ref(false)

async function handleCropped(result: File) {
  isUploading.value = true
  try {
    const { url } = await utilApi.uploadFile(result)
    setValues({ ...values, avatar: url })
    toast.success('团队图标已更新')
  }
  catch (error) {
    console.error('团队图标更新失败', error)
  }
  finally {
    isUploading.value = false
  }
}

onMounted(() => {
  setValues({
    name: props.team.name,
    description: props.team.description ?? '',
    avatar: props.team.avatar ?? '',
  })
})
</script>

<template>
  <TabsContent value="info" force-mount class="flex-1 overflow-auto px-6 py-4 data-[state=inactive]:hidden">
    <form class="space-y-6" @submit="onSubmit">
      <FormField name="avatar">
        <FormItem>
          <FormLabel>团队图标</FormLabel>
          <FormControl>
            <div class="flex items-center gap-4">
              <Avatar class="h-20 w-20 border-2">
                <AvatarImage v-if="values.avatar" :src="values.avatar" />
                <AvatarFallback class="text-2xl font-semibold bg-primary/10 text-primary">
                  {{ getAbbreviation(team.name, 'T') }}
                </AvatarFallback>
              </Avatar>
              <div class="space-y-2">
                <ImageCropper @success="handleCropped">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :disabled="isUpdating || isUploading || !isAdmin"
                  >
                    <Loader2 v-if="isUploading" class="h-4 w-4 mr-2 animate-spin" />
                    <ImagePlus v-else class="h-4 w-4 mr-2" />
                    {{ isUploading ? '上传中...' : '更换团队图标' }}
                  </Button>
                </ImageCropper>
                <p class="text-xs text-muted-foreground">
                  支持 JPG、PNG、WebP 格式
                </p>
              </div>
            </div>
          </FormControl>
        </FormItem>
      </FormField>

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

      <div v-if="isAdmin" class="flex justify-end">
        <Button type="submit" :disabled="isUpdating">
          <Loader2 v-if="isUpdating" class="h-4 w-4 mr-2 animate-spin" />
          保存更改
        </Button>
      </div>
    </form>

    <Separator class="my-6" />

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

    <DeleteTeamDialog
      v-model:open="isDeleteTeamDialogOpen"
      :team="team"
      @deleted="emits('deleted', $event)"
    />
  </TabsContent>
</template>
