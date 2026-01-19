<script lang="ts" setup>
import type { ConfigDetailItem } from '@/types/system-config'
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useForm } from 'vee-validate'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { systemConfigApi } from '@/api/system-config'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useGlobalStore } from '@/stores/useGlobalStore'
import Item from './Item.vue'
import Layout from './Layout.vue'

const globalStore = useGlobalStore()
const { systemConfig } = storeToRefs(globalStore)

const isLoading = ref(true)
const isSaving = ref(false)
const loadError = ref<string | null>(null)

const configItems = ref<ConfigDetailItem[]>([])

const form = useForm({})

/** 加载系统配置 */
async function loadConfigs() {
  isLoading.value = true
  loadError.value = null
  try {
    const data = await systemConfigApi.getConfigsDetail()
    configItems.value = data

    // 初始化表单值
    const initialValues: Record<string, unknown> = {}
    for (const item of data) {
      initialValues[item.key] = item.value
    }
    form.resetForm({ values: initialValues })
  }
  catch (error) {
    console.error('加载系统配置失败', error)
    loadError.value = '加载系统配置失败，请稍后重试'
  }
  finally {
    isLoading.value = false
  }
}

/** 重置为默认值 */
function handleResetToDefault(key: string, defaultValue: unknown) {
  form.setFieldValue(key, defaultValue)
}

/** 提交保存 */
const onSubmit = form.handleSubmit(async (values) => {
  isSaving.value = true
  try {
    await systemConfigApi.updateConfigs(values)
    toast.success('系统配置已保存')

    // 重新加载以确保数据同步
    await loadConfigs()
  }
  catch (error) {
    console.error('保存系统配置失败', error)
  }
  finally {
    isSaving.value = false
  }
})

onMounted(() => {
  loadConfigs()
})
</script>

<template>
  <Layout title="系统设置" description="管理全局系统配置，这些设置会影响整个系统的行为">
    <Alert variant="destructive" class="mb-4">
      <AlertTriangle class="h-4 w-4" />
      <AlertDescription>
        警告：此处的配置会直接影响整个系统的运行逻辑，请谨慎修改。
      </AlertDescription>
    </Alert>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <!-- 加载错误 -->
    <div v-else-if="loadError" class="text-center py-12">
      <p class="text-destructive mb-4">
        {{ loadError }}
      </p>
      <Button variant="outline" @click="loadConfigs">
        <RotateCcw class="h-4 w-4 mr-2" />
        重试
      </Button>
    </div>

    <!-- 配置表单 -->
    <form v-else id="system-config-form" class="space-y-6" @submit="onSubmit">
      <template v-for="(item, index) in configItems" :key="item.key">
        <Item :label="item.description">
          <FormField v-slot="{ componentField, value }" :name="item.key">
            <FormItem>
              <div class="flex items-center justify-between">
                <FormLabel class="text-xs text-muted-foreground font-mono">
                  {{ item.key }}
                </FormLabel>
                <Button
                  v-if="value !== item.defaultValue"
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="h-6 text-xs"
                  @click="handleResetToDefault(item.key, item.defaultValue)"
                >
                  <RotateCcw class="h-3 w-3 mr-1" />
                  恢复默认
                </Button>
              </div>
              <FormControl>
                <!-- 布尔类型：开关 -->
                <div v-if="item.type === 'boolean'" class="flex items-center gap-3">
                  <Switch
                    :model-value="Boolean(value)"
                    @update:model-value="form.setFieldValue(item.key, $event)"
                  />
                  <span class="text-sm text-muted-foreground">
                    {{ value ? '已启用' : '已禁用' }}
                  </span>
                </div>

                <!-- 枚举类型：下拉选择 -->
                <Select
                  v-else-if="item.type === 'enum' && item.options"
                  v-bind="componentField"
                >
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="option in item.options"
                      :key="String(option)"
                      :value="String(option)"
                    >
                      {{ option }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <!-- 数字类型：数字输入 -->
                <Input
                  v-else-if="item.type === 'number'"
                  type="number"
                  :model-value="Number(value)"
                  @update:model-value="form.setFieldValue(item.key, Number($event))"
                />

                <!-- 字符串类型：文本输入 -->
                <Input
                  v-else
                  v-bind="componentField"
                  type="text"
                />
              </FormControl>
              <FormDescription class="text-xs">
                默认值：{{ item.defaultValue }}
              </FormDescription>
            </FormItem>
          </FormField>
        </Item>
        <Separator v-if="index < configItems.length - 1" />
      </template>
    </form>

    <template #footer>
      <Button
        form="system-config-form"
        type="submit"
        :disabled="isSaving || isLoading"
      >
        <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
        保存系统设置
      </Button>
    </template>
  </Layout>
</template>
