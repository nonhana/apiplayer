<script lang="ts" setup>
import { Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useUserProfile } from '@/composables/useUserProfile'
import Item from './Item.vue'
import Layout from './Layout.vue'

const {
  form,
  isSavingProfile,
  isSendingCode,
  displayEmail,
  displayCreatedAt,
  displayLastLoginAt,
  sendVerificationCode,
  saveProfile,
} = useUserProfile()

const onSubmit = form.handleSubmit(async (values) => {
  await saveProfile(values)
})
</script>

<template>
  <Layout title="账号安全" description="管理你的邮箱、密码等账号安全设置">
    <div class="space-y-6">
      <!-- 账号信息展示 -->
      <Item label="账号信息">
        <div class="space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">登录邮箱</span>
            <span class="font-medium">{{ displayEmail || '未绑定' }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">注册时间</span>
            <span>{{ displayCreatedAt || '-' }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">最近登录</span>
            <span>{{ displayLastLoginAt }}</span>
          </div>
        </div>
      </Item>

      <Separator />

      <!-- 验证码发送 -->
      <Item label="安全验证">
        <div class="space-y-3">
          <p class="text-xs text-muted-foreground">
            修改邮箱或密码前，请先发送验证码到当前邮箱。验证码 5 分钟内有效。
          </p>
          <Button
            variant="outline"
            size="sm"
            :disabled="isSendingCode"
            @click="sendVerificationCode"
          >
            <Loader2 v-if="isSendingCode" class="mr-2 h-4 w-4 animate-spin" />
            发送安全验证码到邮箱
          </Button>
        </div>
      </Item>

      <Separator />

      <!-- 安全设置表单 -->
      <form class="space-y-6" @submit="onSubmit">
        <!-- 新邮箱 -->
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

        <!-- 新密码 -->
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

        <!-- 确认新密码 -->
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

        <!-- 验证码 -->
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

        <!-- 保存按钮 -->
        <Button type="submit" :disabled="isSavingProfile">
          <Loader2 v-if="isSavingProfile" class="mr-2 h-4 w-4 animate-spin" />
          保存安全设置
        </Button>
      </form>
    </div>
  </Layout>
</template>
