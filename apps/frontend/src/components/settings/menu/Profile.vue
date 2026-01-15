<script lang="ts" setup>
import { ImagePlus, Loader2 } from 'lucide-vue-next'
import ImageCropper from '@/components/common/ImageCropper.vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useUserProfile } from '@/composables/useUserProfile'
import { getAbbreviation } from '@/lib/utils'
import Item from './Item.vue'
import Layout from './Layout.vue'

const {
  profile,
  form,
  isSavingProfile,
  isUploadingAvatar,
  avatarPreviewUrl,
  saveProfile,
  uploadAvatar,
} = useUserProfile()

const onSubmit = form.handleSubmit(async (values) => {
  await saveProfile(values)
})

async function handleCropped(result: File) {
  await uploadAvatar(result)
}
</script>

<template>
  <Layout title="个人资料" description="管理你的基本信息和头像，这些信息会显示在团队成员和项目中">
    <form class="space-y-6" @submit="onSubmit">
      <!-- 头像设置 -->
      <Item label="头像">
        <div class="flex items-center gap-4">
          <Avatar class="h-16 w-16 border">
            <AvatarImage v-if="avatarPreviewUrl" :src="avatarPreviewUrl" alt="avatar" />
            <AvatarFallback class="text-lg font-semibold">
              {{ getAbbreviation(profile?.name ?? '', 'U') }}
            </AvatarFallback>
          </Avatar>
          <div class="space-y-2">
            <ImageCropper
              v-slot="{ disabled }"
              :disabled="isSavingProfile || isUploadingAvatar"
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

      <!-- 显示名称 -->
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

      <!-- 用户名 -->
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

      <!-- 个人简介 -->
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

      <!-- 保存按钮 -->
      <div class="pt-2">
        <Button type="submit" :disabled="isSavingProfile">
          <Loader2 v-if="isSavingProfile" class="mr-2 h-4 w-4 animate-spin" />
          保存基本信息
        </Button>
      </div>
    </form>
  </Layout>
</template>
