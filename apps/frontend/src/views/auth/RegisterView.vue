<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Loader2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import * as z from 'zod'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useUserStore } from '@/stores/useUserStore'

const router = useRouter()
const userStore = useUserStore()
const isLoading = ref(false)

const formSchema = toTypedSchema(z.object({
  email: z.string().email('Please enter a valid email address'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[\w-]+$/, 'Username can only contain letters, numbers, underscores and dashes'),
  name: z.string().min(1, 'Name is required').max(50),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword'],
}))

const form = useForm({
  validationSchema: formSchema,
})

async function checkAvailability(field: 'email' | 'username', value: string) {
  if (!value)
    return
  // Don't check if field is already invalid (simple check)
  if (form.errors.value[field])
    return

  try {
    const res = await authApi.checkAvailability({ [field]: value })
    if (!res.available) {
      form.setFieldError(field, res.message || `${field} is already taken`)
    }
  }
  catch (error) {
    console.error(`Failed to check ${field} availability`, error)
  }
}

const onSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true
  try {
    await userStore.register(values)
    toast.success('Registration successful!', {
      description: 'You can now log in with your new account.',
    })
    router.push('/auth/login')
  }
  catch (error: any) {
    console.error(error)
    // Error is handled globally
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
        Create an account
      </CardTitle>
      <CardDescription>
        Enter your details below to create your account
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ componentField, value }" name="email">
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="m@example.com"
                v-bind="componentField"
                @blur="checkAvailability('email', value as string)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField, value }" name="username">
          <FormItem>
            <FormLabel>Username</FormLabel>
            <FormControl>
              <Input
                placeholder="username"
                v-bind="componentField"
                @blur="checkAvailability('username', value as string)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormControl>
              <Input placeholder="John Doe" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="******" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="confirmPassword">
          <FormItem>
            <FormLabel>Confirm Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="******" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <Button type="submit" class="w-full" :disabled="isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          Sign Up
        </Button>
      </form>
    </CardContent>
    <CardFooter class="flex justify-center">
      <div class="text-sm text-muted-foreground">
        Already have an account?
        <router-link to="/auth/login" class="text-primary hover:underline">
          Sign in
        </router-link>
      </div>
    </CardFooter>
  </Card>
</template>
