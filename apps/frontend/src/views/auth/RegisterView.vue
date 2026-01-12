<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { registerFormSchema } from '@/validators/register'

const route = useRoute()
const router = useRouter()
const isLoading = ref(false)

const form = useForm({
  validationSchema: registerFormSchema,
})

// 如果 URL 中有 email 参数，预填充邮箱
onMounted(() => {
  const email = route.query.email as string | undefined
  if (email) {
    form.setFieldValue('email', email)
  }
})

const onSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true
  try {
    await authApi.register(values)
    toast.success('注册成功！', {
      description: '您现在可以使用新账号登录。',
    })

    // 如果有 redirect 参数，传递给登录页
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
