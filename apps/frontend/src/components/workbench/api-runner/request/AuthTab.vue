<script lang="ts" setup>
import type { AuthType } from '@/types/proxy'
import { computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'

const runnerStore = useApiRunnerStore()

interface AuthOption {
  value: AuthType
  label: string
  description: string
}

const authOptions: AuthOption[] = [
  { value: 'none', label: '无认证', description: '不添加任何认证信息' },
  { value: 'bearer', label: 'Bearer Token', description: '使用 Bearer Token 认证' },
  { value: 'basic', label: 'Basic Auth', description: '使用用户名和密码进行基础认证' },
]

/** 当前认证类型 */
const authType = computed({
  get: () => runnerStore.auth.type,
  set: (val: AuthType) => runnerStore.setAuthType(val),
})

/** Bearer Token */
const bearerToken = computed({
  get: () => runnerStore.auth.bearerToken ?? '',
  set: val => runnerStore.setBearerToken(val),
})

/** Basic Auth 用户名 */
const basicUsername = computed({
  get: () => runnerStore.auth.basicUsername ?? '',
  set: val => runnerStore.setBasicAuth(val, runnerStore.auth.basicPassword ?? ''),
})

/** Basic Auth 密码 */
const basicPassword = computed({
  get: () => runnerStore.auth.basicPassword ?? '',
  set: val => runnerStore.setBasicAuth(runnerStore.auth.basicUsername ?? '', val),
})
</script>

<template>
  <div class="p-4 space-y-6">
    <!-- 认证类型选择 -->
    <div class="space-y-2">
      <Label class="text-muted-foreground">认证方式</Label>
      <Select v-model="authType">
        <SelectTrigger class="w-[240px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in authOptions"
            :key="option.value"
            :value="option.value"
          >
            <div class="flex flex-col">
              <span>{{ option.label }}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <p class="text-xs text-muted-foreground">
        {{ authOptions.find(o => o.value === authType)?.description }}
      </p>
    </div>

    <!-- 无认证 -->
    <div v-if="authType === 'none'" class="py-4 text-center text-muted-foreground">
      该请求不需要认证
    </div>

    <!-- Bearer Token -->
    <div v-else-if="authType === 'bearer'" class="space-y-4">
      <div class="space-y-2">
        <Label>Token</Label>
        <Input
          v-model="bearerToken"
          type="password"
          placeholder="输入 Bearer Token..."
          class="font-mono"
        />
        <p class="text-xs text-muted-foreground">
          将自动添加到请求头：Authorization: Bearer &lt;token&gt;
        </p>
      </div>
    </div>

    <!-- Basic Auth -->
    <div v-else-if="authType === 'basic'" class="space-y-4">
      <div class="space-y-2">
        <Label>用户名</Label>
        <Input
          v-model="basicUsername"
          placeholder="输入用户名..."
        />
      </div>
      <div class="space-y-2">
        <Label>密码</Label>
        <Input
          v-model="basicPassword"
          type="password"
          placeholder="输入密码..."
        />
      </div>
      <p class="text-xs text-muted-foreground">
        将自动添加到请求头：Authorization: Basic &lt;base64(username:password)&gt;
      </p>
    </div>
  </div>
</template>
