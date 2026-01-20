<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useForm } from 'vee-validate'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { authApi } from '@/api/auth'
import { emailCodeApi } from '@/api/email-code'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useGlobalStore } from '@/stores/useGlobalStore'
import { registerFormSchema } from '@/validators/register'

const globalStore = useGlobalStore()
const { systemConfig } = storeToRefs(globalStore)

const route = useRoute()
const router = useRouter()

const form = useForm({
  validationSchema: registerFormSchema,
})

const isLoading = ref(false)
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

async function sendEmailCode() {
  if (isSendingCode.value || sendingCodeDisabled.value) {
    return
  }

  const email = form.values.email
  if (!email) {
    toast.error('请填写邮箱')
    return
  }

  isSendingCode.value = true
  try {
    await emailCodeApi.sendEmailCode(email)
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

// 预填充 query 参数
onMounted(() => {
  const email = route.query.email
  if (email) {
    form.setFieldValue('email', email as string)
  }
})

const onSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true
  try {
    await authApi.register(values)
    toast.success('注册成功！', {
      description: '您现在可以使用新账号登录。',
    })

    const redirect = route.query.redirect as string | undefined
    if (redirect) {
      router.push({
        path: '/auth/login',
        query: { redirect },
      })
    }
    else {
      router.push('/auth/login')
    }
  }
  catch (error) {
    console.error('注册失败', error)
  }
  finally {
    isLoading.value = false
  }
})
</script>

<template>
  <Card class="w-full shadow-lg">
    <CardHeader>
      <CardTitle class="text-2xl">
        注册新账号
      </CardTitle>
      <CardDescription>
        请填写以下信息完成注册
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>邮箱</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="请输入邮箱地址"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField
          v-if="systemConfig.register_email_verify"
          v-slot="{ componentField }"
          name="verificationCode"
        >
          <FormItem>
            <FormLabel>邮箱验证码</FormLabel>
            <div class="flex items-center justify-between gap-2">
              <div class="flex-1">
                <FormControl>
                  <Input
                    type="text"
                    placeholder="请输入验证码"
                    v-bind="componentField"
                  />
                </FormControl>
              </div>
              <Button
                type="button"
                variant="outline"
                :disabled="isSendingCode || sendingCodeDisabled"
                @click="sendEmailCode"
              >
                <Loader2 v-if="isSendingCode" class="h-4 w-4 animate-spin" />
                <div v-if="sendingCodeDisabled" class="h-4 w-4 text-xs text-muted-foreground">
                  {{ sendingCodeCountdown }}
                </div>
                发送验证码
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="username">
          <FormItem>
            <FormLabel>用户名</FormLabel>
            <FormControl>
              <Input
                placeholder="请输入用户名"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>姓名</FormLabel>
            <FormControl>
              <Input placeholder="请输入姓名" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>密码</FormLabel>
            <FormControl>
              <Input type="password" placeholder="请输入密码" password-toggle v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="confirmPassword">
          <FormItem>
            <FormLabel>确认密码</FormLabel>
            <FormControl>
              <Input type="password" placeholder="请再次输入密码" password-toggle v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <Button type="submit" class="w-full" :disabled="isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          注册
        </Button>
      </form>
    </CardContent>
    <CardFooter class="flex justify-center">
      <div class="text-sm text-muted-foreground">
        已有账号？
        <router-link to="/auth/login" class="text-primary hover:underline">
          立即登录
        </router-link>
      </div>
    </CardFooter>
  </Card>
</template>
