<script lang="ts" setup>
import { Loader2 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useForm } from 'vee-validate'
import { computed, onUnmounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { emailCodeApi } from '@/api/email-code'
import { userApi } from '@/api/user'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import dayjs from '@/lib/dayjs'
import { useUserStore } from '@/stores/useUserStore'
import { userSecurityFormSchema } from '@/validators/user-security'
import Item from './Item.vue'
import Layout from './Layout.vue'

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const displayEmail = computed(() => user.value?.email ?? '')
const displayCreatedAt = computed(() =>
  user.value?.createdAt
    ? dayjs(user.value.createdAt).format('YYYY-MM-DD HH:mm:ss')
    : '',
)
const displayLastLoginAt = computed(() =>
  user.value?.lastLoginAt
    ? dayjs(user.value.lastLoginAt).format('YYYY-MM-DD HH:mm:ss')
    : '首次登录',
)

const isSaving = ref(false)
const isSendingCode = ref(false)

// 发送验证码计时器
const sendingCodeCountdown = ref(0)
const sendingCodeDisabled = computed(() => sendingCodeCountdown.value > 0)

let sendCodeTimer: ReturnType<typeof setInterval> | null = null
function startSendCodeTimer(seconds = 60) {
  clearSendCodeTimer()
  sendingCodeCountdown.value = seconds
  sendCodeTimer = setInterval(() => {
    if (sendingCodeCountdown.value <= 1) {
      sendingCodeCountdown.value = 0
      clearSendCodeTimer()
      return
    }
    sendingCodeCountdown.value--
  }, 1000)
}
function clearSendCodeTimer() {
  if (sendCodeTimer) {
    clearInterval(sendCodeTimer)
    sendCodeTimer = null
  }
}

onUnmounted(() => {
  clearSendCodeTimer()
})

const form = useForm({
  validationSchema: userSecurityFormSchema,
})

async function sendEmailCode() {
  if (isSendingCode.value || sendingCodeDisabled.value) {
    return
  }

  const newEmail = form.values.newEmail
  if (!newEmail) {
    toast.error('请填写新邮箱')
    return
  }

  isSendingCode.value = true
  try {
    await emailCodeApi.sendEmailCode(newEmail)
    startSendCodeTimer()
    toast.success('验证码已发送', {
      description: '请在 5 分钟内前往邮箱查收验证码。',
    })
  }
  catch (error) {
    console.error('发送验证码失败', error)
  }
  finally {
    isSendingCode.value = false
  }
}

// 提交更新
const onSubmit = form.handleSubmit(async (values) => {
  isSaving.value = true
  try {
    const updated = await userApi.updateProfile(values)
    userStore.setUser(updated)
    form.resetForm()
    toast.success('安全设置已更新')
  }
  catch (error) {
    console.error('更新安全设置失败', error)
  }
  finally {
    isSaving.value = false
  }
})
</script>

<template>
  <Layout title="账号安全" description="管理你的邮箱、密码等账号安全设置">
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

    <Item label="安全验证">
      <div class="space-y-3">
        <p class="text-xs text-muted-foreground">
          修改邮箱或密码前，请先发送验证码到当前邮箱。验证码 5 分钟内有效。
        </p>
        <Button
          variant="outline"
          size="sm"
          :disabled="isSendingCode || sendingCodeDisabled"
          @click="sendEmailCode"
        >
          <Loader2 v-if="isSendingCode" class="h-4 w-4 animate-spin" />
          <div v-if="sendingCodeDisabled" class="h-4 w-4 text-xs text-muted-foreground">
            {{ sendingCodeCountdown }}
          </div>
          发送安全验证码
        </Button>
      </div>
    </Item>

    <Separator />

    <form id="account-security-form" class="space-y-6" @submit="onSubmit">
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

      <Separator />

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
    </form>
    <template #footer>
      <Button form="account-security-form" type="submit" :disabled="isSaving">
        <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
        保存安全设置
      </Button>
    </template>
  </Layout>
</template>
