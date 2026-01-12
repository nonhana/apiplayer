<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useUserStore } from '@/stores/useUserStore'
import { loginFormSchema } from '@/validators/login'

const router = useRouter()
const userStore = useUserStore()
const isLoading = ref(false)

const form = useForm({
  validationSchema: loginFormSchema,
})

const route = useRoute()

const onSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true
  try {
    const { token, user } = await authApi.login(values)
    userStore.setToken(token)
    userStore.setUser(user)

    toast.success('欢迎回来！', {
      description: '登录成功，欢迎使用。',
    })

    // 如果有 redirect 参数，跳转到该地址
    const redirect = route.query.redirect as string | undefined
    if (redirect) {
      router.push(redirect)
    }
    else {
      router.push('/dashboard')
    }
  }
  catch (error) {
    console.error('登录失败', error)
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
        登录账号
      </CardTitle>
      <CardDescription>
        输入您的邮箱和密码以登录
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>邮箱</FormLabel>
            <FormControl>
              <Input type="email" placeholder="请输入邮箱地址" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>密码</FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder="请输入密码"
                password-toggle
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ value, handleChange }" name="rememberMe">
          <FormItem class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox :checked="value" @update:checked="handleChange" />
            </FormControl>
            <div class="space-y-1 leading-none">
              <FormLabel>
                记住我
              </FormLabel>
            </div>
          </FormItem>
        </FormField>

        <Button type="submit" class="w-full" :disabled="isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          登录
        </Button>
      </form>
    </CardContent>
    <CardFooter class="flex justify-center">
      <div class="text-sm text-muted-foreground">
        还没有账号？
        <router-link to="/auth/register" class="text-primary hover:underline">
          立即注册
        </router-link>
      </div>
    </CardFooter>
  </Card>
</template>
