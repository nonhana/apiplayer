<script lang="ts" setup>
import { ImagePlus, Loader2 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useForm } from 'vee-validate'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { userApi } from '@/api/user'
import { utilApi } from '@/api/util'
import ImageCropper from '@/components/common/ImageCropper.vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getAbbreviation } from '@/lib/utils'
import { useUserStore } from '@/stores/useUserStore'
import { userProfileFormSchema } from '@/validators/user-profile'
import Item from './Item.vue'
import Layout from './Layout.vue'

const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const { setUser } = userStore

const isSaving = ref(false)
const isUploadingAvatar = ref(false)

const form = useForm({
  validationSchema: userProfileFormSchema,
  initialValues: {
    name: user.value?.name,
    username: user.value?.username,
    avatar: user.value?.avatar,
    bio: user.value?.bio,
  },
})

const avatarPreviewUrl = computed(() => {
  const formAvatar = form.values.avatar
  if (formAvatar && formAvatar !== '')
    return formAvatar
  return user.value?.avatar
})

async function handleCropped(file: File) {
  isUploadingAvatar.value = true
  try {
    const { url } = await utilApi.uploadFile(file)
    form.setFieldValue('avatar', url)
    toast.success('头像已更新')
  }
  catch (error) {
    console.error('头像更新失败', error)
  }
  finally {
    isUploadingAvatar.value = false
  }
}

// 提交更新
const onSubmit = form.handleSubmit(async (values) => {
  isSaving.value = true
  try {
    const updated = await userApi.updateProfile(values)
    setUser(updated)
    form.resetForm({
      values: {
        name: updated.name,
        username: updated.username,
        avatar: updated.avatar,
        bio: updated.bio,
      },
    })
    toast.success('个人资料已更新')
  }
  catch (error) {
    console.error('更新个人资料失败', error)
  }
  finally {
    isSaving.value = false
  }
})
</script>

<template>
  <Layout title="个人资料" description="管理你的基本信息和头像，这些信息会显示在团队成员和项目中">
    <form id="profile-form" class="space-y-6" @submit="onSubmit">
      <Item label="头像">
        <div class="flex items-center gap-4">
          <Avatar class="h-20 w-20 border">
            <AvatarImage v-if="avatarPreviewUrl" :src="avatarPreviewUrl" alt="avatar" />
            <AvatarFallback class="text-lg font-semibold">
              {{ getAbbreviation(user?.name ?? '', 'U') }}
            </AvatarFallback>
          </Avatar>
          <div class="space-y-2">
            <ImageCropper
              v-slot="{ disabled }"
              :disabled="isSaving || isUploadingAvatar"
              @success="handleCropped"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                :disabled="disabled"
              >
                <Loader2 v-if="isUploadingAvatar" class="h-4 w-4 mr-2 animate-spin" />
                <ImagePlus v-else class="h-4 w-4 mr-2" />
                {{ isUploadingAvatar ? '上传中...' : '更换头像' }}
              </Button>
            </ImageCropper>
            <p class="text-xs text-muted-foreground">
              支持 JPG、PNG、WebP、Avif 格式，尺寸最好不小于 256×256
            </p>
          </div>
        </div>
      </Item>

      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel>显示名称</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              placeholder="你的昵称"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="username">
        <FormItem>
          <FormLabel>用户名</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              placeholder="username"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="bio">
        <FormItem>
          <FormLabel>个人简介</FormLabel>
          <FormControl>
            <Textarea
              v-bind="componentField"
              rows="3"
              placeholder="简单介绍一下你自己，最多 200 字。"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </form>
    <template #footer>
      <Button form="profile-form" type="submit" :disabled="isSaving">
        <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
        保存基本信息
      </Button>
    </template>
  </Layout>
</template>
