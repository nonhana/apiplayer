<script setup lang="ts">
import type { VerifyInvitationResult } from '@/types/team'
import { AlertCircle, CheckCircle2, Loader2, Mail, Users, XCircle } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { invitationApi } from '@/api/team'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getAbbreviation } from '@/lib/utils'
import { useUserStore } from '@/stores/useUserStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const token = computed(() => route.query.token as string | undefined)

const isLoading = ref(true)
const isAccepting = ref(false)
const verifyResult = ref<VerifyInvitationResult | null>(null)

/** 错误消息映射 */
const errorMessages: Record<string, string> = {
  INVALID_TOKEN: '邀请链接无效或已被使用',
  EXPIRED: '邀请链接已过期',
  ALREADY_ACCEPTED: '该邀请已被接受',
  CANCELLED: '该邀请已被撤销',
  EMAIL_MISMATCH: '请使用被邀请的邮箱账号登录',
  ALREADY_MEMBER: '您已经是该团队的成员',
}

const errorMessage = computed(() => {
  if (!verifyResult.value)
    return null
  if (verifyResult.value.valid)
    return null
  return errorMessages[verifyResult.value.error ?? ''] ?? '邀请验证失败'
})

const invitation = computed(() => verifyResult.value?.invitation)

/** 当前登录用户的邮箱是否与邀请邮箱匹配 */
const isEmailMatch = computed(() => {
  if (!userStore.isAuthenticated || !invitation.value)
    return false
  return userStore.user?.email === invitation.value.email
})

/** 需要先登录 */
const needsLogin = computed(() => {
  if (!verifyResult.value?.valid)
    return false
  return !userStore.isAuthenticated && verifyResult.value.emailRegistered
})

/** 需要先注册 */
const needsRegister = computed(() => {
  if (!verifyResult.value?.valid)
    return false
  return !userStore.isAuthenticated && !verifyResult.value.emailRegistered
})

/** 邮箱不匹配 */
const emailMismatch = computed(() => {
  if (!verifyResult.value?.valid)
    return false
  if (!userStore.isAuthenticated)
    return false
  return !isEmailMatch.value
})

/** 可以接受邀请 */
const canAccept = computed(() => {
  return verifyResult.value?.valid && userStore.isAuthenticated && isEmailMatch.value
})

async function verifyInvitation() {
  if (!token.value) {
    verifyResult.value = { valid: false, error: 'INVALID_TOKEN' }
    isLoading.value = false
    return
  }

  try {
    verifyResult.value = await invitationApi.verifyInvitation(token.value)
  }
  catch (error) {
    console.error('验证邀请失败', error)
    verifyResult.value = { valid: false, error: 'INVALID_TOKEN' }
  }
  finally {
    isLoading.value = false
  }
}

async function handleAccept() {
  if (!token.value || !canAccept.value)
    return

  isAccepting.value = true
  try {
    const result = await invitationApi.acceptInvitation(token.value)

    if (result.success) {
      toast.success('加入成功', {
        description: `您已成功加入团队「${invitation.value?.teamName}」`,
      })
      router.push('/dashboard')
    }
    else {
      const msg = errorMessages[result.error ?? ''] ?? '接受邀请失败'
      toast.error('操作失败', { description: msg })
    }
  }
  catch (error) {
    console.error('接受邀请失败', error)
  }
  finally {
    isAccepting.value = false
  }
}

function goToLogin() {
  // 保存当前 URL，登录后重定向回来
  const redirectUrl = route.fullPath
  router.push({
    name: 'Login',
    query: { redirect: redirectUrl },
  })
}

function goToRegister() {
  // 保存当前 URL 和预填邮箱
  const redirectUrl = route.fullPath
  router.push({
    name: 'Register',
    query: {
      redirect: redirectUrl,
      email: invitation.value?.email,
    },
  })
}

function goToLogout() {
  // 退出登录后重新访问当前页面
  userStore.logout()
  verifyInvitation()
}

onMounted(() => {
  verifyInvitation()
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/30 p-4">
    <Card class="w-full max-w-md">
      <!-- 加载中 -->
      <template v-if="isLoading">
        <CardContent class="py-12 text-center">
          <Loader2 class="h-8 w-8 animate-spin mx-auto text-primary" />
          <p class="mt-4 text-muted-foreground">
            正在验证邀请...
          </p>
        </CardContent>
      </template>

      <!-- 验证失败 -->
      <template v-else-if="!verifyResult?.valid">
        <CardHeader class="text-center">
          <div class="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle class="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>邀请无效</CardTitle>
          <CardDescription>{{ errorMessage }}</CardDescription>
        </CardHeader>
        <CardFooter class="justify-center">
          <Button variant="outline" @click="router.push('/')">
            返回首页
          </Button>
        </CardFooter>
      </template>

      <!-- 验证成功 -->
      <template v-else-if="invitation">
        <CardHeader class="text-center">
          <div class="mx-auto mb-4">
            <Avatar class="h-16 w-16">
              <AvatarImage v-if="invitation.teamAvatar" :src="invitation.teamAvatar" />
              <AvatarFallback class="text-lg bg-primary/10 text-primary">
                {{ getAbbreviation(invitation.teamName, 'T') }}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle>加入团队</CardTitle>
          <CardDescription>
            <span class="font-medium text-foreground">{{ invitation.inviterName }}</span>
            邀请您加入团队
          </CardDescription>
        </CardHeader>

        <CardContent class="space-y-4">
          <!-- 团队信息 -->
          <div class="rounded-lg border p-4 space-y-3">
            <div class="flex items-center gap-3">
              <Users class="h-5 w-5 text-muted-foreground" />
              <div>
                <p class="font-medium">
                  {{ invitation.teamName }}
                </p>
                <p class="text-sm text-muted-foreground">
                  团队
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <Mail class="h-5 w-5 text-muted-foreground" />
              <div>
                <p class="font-medium">
                  {{ invitation.email }}
                </p>
                <p class="text-sm text-muted-foreground">
                  邀请邮箱
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <CheckCircle2 class="h-5 w-5 text-muted-foreground" />
              <div>
                <p class="font-medium">
                  {{ invitation.roleDescription || invitation.roleName }}
                </p>
                <p class="text-sm text-muted-foreground">
                  分配角色
                </p>
              </div>
            </div>
          </div>

          <!-- 需要登录 -->
          <div v-if="needsLogin" class="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
            <div class="flex items-start gap-3">
              <AlertCircle class="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p class="font-medium text-amber-600">
                  需要登录
                </p>
                <p class="text-sm text-muted-foreground mt-1">
                  请使用 <span class="font-medium">{{ invitation.email }}</span> 账号登录后接受邀请
                </p>
              </div>
            </div>
          </div>

          <!-- 需要注册 -->
          <div v-else-if="needsRegister" class="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
            <div class="flex items-start gap-3">
              <AlertCircle class="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p class="font-medium text-blue-600">
                  需要注册
                </p>
                <p class="text-sm text-muted-foreground mt-1">
                  邮箱 <span class="font-medium">{{ invitation.email }}</span> 尚未注册，请先完成注册
                </p>
              </div>
            </div>
          </div>

          <!-- 邮箱不匹配 -->
          <div v-else-if="emailMismatch" class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div class="flex items-start gap-3">
              <XCircle class="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p class="font-medium text-destructive">
                  邮箱不匹配
                </p>
                <p class="text-sm text-muted-foreground mt-1">
                  当前登录账号为 <span class="font-medium">{{ userStore.user?.email }}</span>，
                  请退出后使用 <span class="font-medium">{{ invitation.email }}</span> 登录
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter class="flex-col gap-2">
          <!-- 可以接受邀请 -->
          <template v-if="canAccept">
            <Button class="w-full" :disabled="isAccepting" @click="handleAccept">
              <Loader2 v-if="isAccepting" class="h-4 w-4 mr-2 animate-spin" />
              接受邀请
            </Button>
            <Button variant="outline" class="w-full" @click="router.push('/')">
              暂不加入
            </Button>
          </template>

          <!-- 需要登录 -->
          <template v-else-if="needsLogin">
            <Button class="w-full" @click="goToLogin">
              前往登录
            </Button>
          </template>

          <!-- 需要注册 -->
          <template v-else-if="needsRegister">
            <Button class="w-full" @click="goToRegister">
              前往注册
            </Button>
          </template>

          <!-- 邮箱不匹配 -->
          <template v-else-if="emailMismatch">
            <Button class="w-full" variant="outline" @click="goToLogout">
              退出当前账号
            </Button>
          </template>
        </CardFooter>
      </template>
    </Card>
  </div>
</template>
