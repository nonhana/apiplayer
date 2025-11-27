<script setup lang="ts">
import type { UpdateUserProfileReq, UserFullInfo } from '@/types/user'
import { Loader2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { userApi } from '@/api/user'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import Cropper from '@/components/user-profile/Cropper.vue'
import { useUserStore } from '@/stores/useUserStore'
import { userProfileFormSchema } from '@/validators/user-profile'

const userStore = useUserStore()

const profile = ref<UserFullInfo | null>(null)
const isLoadingProfile = ref(false)
const isSavingProfile = ref(false)
const isSendingCode = ref(false)

// 头像裁剪相关状态
const isAvatarCropperOpen = ref(false)
const avatarSourceUrl = ref<string | null>(null)

const form = useForm({
  validationSchema: userProfileFormSchema,
})

const displayEmail = computed(() => profile.value?.email ?? '')
const displayCreatedAt = computed(() => profile.value?.createdAt
  ? new Date(profile.value.createdAt).toLocaleString()
  : '')
const displayLastLoginAt = computed(() => profile.value?.lastLoginAt
  ? new Date(profile.value.lastLoginAt).toLocaleString()
  : '首次登录')

// 初始头像，取用户名、邮箱或显示名称的首字母
const avatarInitials = computed(() => {
  const name = profile.value?.name || profile.value?.username || profile.value?.email || 'U'
  const trimmed = name.trim()
  if (!trimmed)
    return 'U'
  const parts = trimmed.split(' ')
  if (parts.length === 1)
    return parts[0]?.charAt(0)?.toUpperCase() ?? 'U'
  return ((parts[0]?.charAt(0) ?? '') + (parts[1]?.charAt(0) ?? '')).toUpperCase() || 'U'
})

// 头像预览URL
const avatarPreviewUrl = computed(() => {
  const formAvatar = form.values.avatar
  if (formAvatar && formAvatar !== '')
    return formAvatar
  return profile.value?.avatar ?? ''
})

async function loadProfile() {
  try {
    isLoadingProfile.value = true
    const res = await userApi.getProfile()
    profile.value = res
    userStore.setUser(res)

    form.setValues({
      name: res.name,
      username: res.username,
      avatar: res.avatar ?? '',
      bio: res.bio ?? '',
      newEmail: '',
      newPassword: '',
      confirmNewPassword: '',
      verificationCode: '',
    })
  }
  finally {
    isLoadingProfile.value = false
  }
}

onMounted(() => {
  loadProfile()
})

async function handleAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file)
    return

  const reader = new FileReader()

  reader.onload = () => {
    avatarSourceUrl.value = reader.result as string
    isAvatarCropperOpen.value = true
  }

  reader.readAsDataURL(file)
  target.value = ''
}

async function handleSendVerificationCode() {
  try {
    isSendingCode.value = true
    await userApi.sendProfileVerificationCode()
    toast.success('验证码已发送', {
      description: '请在 5 分钟内前往邮箱查收验证码。',
    })
  }
  finally {
    isSendingCode.value = false
  }
}

const onSubmit = form.handleSubmit(async (values) => {
  const payload: UpdateUserProfileReq = {
    name: values.name,
    username: values.username,
    avatar: values.avatar || undefined,
    bio: values.bio || undefined,
    newEmail: values.newEmail || undefined,
    newPassword: values.newPassword || undefined,
    confirmNewPassword: values.confirmNewPassword || undefined,
    verificationCode: values.verificationCode || undefined,
  }

  isSavingProfile.value = true
  try {
    const updated = await userApi.updateProfile(payload)
    profile.value = updated
    userStore.setUser(updated)

    toast.success('个人资料已更新')

    form.setFieldValue('newEmail', '')
    form.setFieldValue('newPassword', '')
    form.setFieldValue('confirmNewPassword', '')
    form.setFieldValue('verificationCode', '')
  }
  finally {
    isSavingProfile.value = false
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          个人资料
        </h1>
        <p class="text-sm text-muted-foreground mt-1">
          管理你的基本信息、头像以及账号安全设置。
        </p>
      </div>
    </div>

    <div class="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <!-- 左侧：基础信息 & 头像 -->
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>
            这些信息会显示在团队成员和项目中。
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <div class="flex items-center gap-4">
            <Avatar class="h-16 w-16 border">
              <AvatarImage v-if="avatarPreviewUrl" :src="avatarPreviewUrl" alt="avatar" />
              <AvatarFallback class="text-lg font-semibold">
                {{ avatarInitials }}
              </AvatarFallback>
            </Avatar>
            <div class="space-y-2">
              <div class="text-sm text-muted-foreground">
                支持 jpg、png 等常见图片格式，建议尺寸不小于 256×256。
              </div>
              <Button size="sm" variant="outline" as-child>
                <label class="cursor-pointer">
                  更换头像
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleAvatarChange"
                  >
                </label>
              </Button>
            </div>
          </div>

          <Separator />

          <form class="space-y-4" @submit="onSubmit">
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
                    rows="4"
                    placeholder="简单介绍一下你自己，最多 200 字。"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <CardFooter class="px-0">
              <Button type="submit" :disabled="isSavingProfile">
                <Loader2 v-if="isSavingProfile" class="mr-2 h-4 w-4 animate-spin" />
                保存基本信息
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>

      <!-- 右侧：账号与安全 -->
      <Card>
        <CardHeader>
          <CardTitle>账号与安全</CardTitle>
          <CardDescription>
            修改邮箱或密码前，请先发送验证码到当前邮箱。
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">
              登录邮箱
            </div>
            <div class="text-sm font-medium">
              {{ displayEmail }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <div class="font-medium">
                注册时间
              </div>
              <div class="mt-1 text-foreground">
                {{ displayCreatedAt || '-' }}
              </div>
            </div>
            <div>
              <div class="font-medium">
                最近登录
              </div>
              <div class="mt-1 text-foreground">
                {{ displayLastLoginAt }}
              </div>
            </div>
          </div>

          <Separator />

          <Button
            variant="outline"
            size="sm"
            :disabled="isSendingCode"
            @click="handleSendVerificationCode"
          >
            <Loader2 v-if="isSendingCode" class="mr-2 h-4 w-4 animate-spin" />
            发送安全验证码到邮箱
          </Button>

          <p class="text-xs text-muted-foreground">
            修改邮箱或密码时，需要提供一次性验证码。验证码 5 分钟内有效。
          </p>

          <form class="space-y-4" @submit="onSubmit">
            <FormField v-slot="{ componentField }" name="newEmail">
              <FormItem>
                <FormLabel>新邮箱</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    type="email"
                    placeholder="新邮箱地址（可选）"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <Separator />

            <FormField v-slot="{ componentField }" name="newPassword">
              <FormItem>
                <FormLabel>新密码</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    type="password"
                    placeholder="新密码（可选）"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="confirmNewPassword">
              <FormItem>
                <FormLabel>确认新密码</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    type="password"
                    placeholder="再次输入新密码"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="verificationCode">
              <FormItem>
                <FormLabel>邮箱验证码</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    inputmode="numeric"
                    maxlength="6"
                    placeholder="6 位验证码"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <CardFooter class="px-0">
              <Button type="submit" :disabled="isSavingProfile">
                <Loader2 v-if="isSavingProfile" class="mr-2 h-4 w-4 animate-spin" />
                保存安全信息
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>

    <div
      v-if="isLoadingProfile"
      class="fixed inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-40"
    >
      <div class="flex items-center gap-3 text-sm text-muted-foreground bg-card px-4 py-2 rounded-lg border shadow-sm">
        <Loader2 class="h-4 w-4 animate-spin" />
        正在加载个人资料…
      </div>
    </div>
  </div>

  <Cropper
    v-model:open="isAvatarCropperOpen"
    v-model:source-url="avatarSourceUrl"
    @confirm="(url) => form.setFieldValue('avatar', url)"
  />
</template>
