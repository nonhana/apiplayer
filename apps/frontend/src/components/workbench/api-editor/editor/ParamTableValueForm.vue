<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import type { ParamType } from '@/types/api'
import { computed } from 'vue'
import { Input } from '@/components/ui/input'
import {
  NumberField,
  NumberFieldInput,
} from '@/components/ui/number-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/**
 * 根据参数类型动态渲染对应的表单输入控件
 *
 * - string: 普通文本输入
 * - number: 数字输入（允许小数）
 * - integer: 整数输入
 * - boolean: 下拉选择 true/false
 * - array: 文本输入（逗号分隔）
 * - object: 文本输入（JSON 格式）
 * - file: 隐藏
 */

const props = withDefaults(defineProps<{
  /** 参数类型 */
  type: ParamType
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义样式 */
  class?: HTMLAttributes['class']
  /** 占位符文本 */
  placeholder?: string
}>(), {
  disabled: false,
  placeholder: '',
})

const modelValue = defineModel<string | number>('modelValue')

/** 将字符串值转换为数字（用于 NumberField） */
const numericValue = computed({
  get: () => {
    const num = Number(modelValue.value)
    return Number.isNaN(num) ? undefined : num
  },
  set: (val: number | undefined) => {
    modelValue.value = val === undefined ? '' : String(val)
  },
})

/** object 类型的占位符 */
const objectPlaceholder = '{"k": "v"}'
</script>

<template>
  <div v-if="type === 'file'" />

  <Select
    v-else-if="type === 'boolean'"
    v-model="modelValue"
    :disabled="disabled"
  >
    <SelectTrigger :class="cn('h-8 text-xs font-mono', props.class)">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="true">
        <span class="font-mono text-green-600 dark:text-green-400">true</span>
      </SelectItem>
      <SelectItem value="false">
        <span class="font-mono text-red-600 dark:text-red-400">false</span>
      </SelectItem>
    </SelectContent>
  </Select>

  <NumberField
    v-else-if="type === 'number'"
    v-model="numericValue"
    :disabled="disabled"
    :step="Math.pow(10, -5)"
    :format-options="{
      minimumFractionDigits: 0,
      maximumFractionDigits: 5,
    }"
    class="w-full"
  >
    <NumberFieldInput :class="cn('h-8 text-xs font-mono text-left px-3', props.class)" />
  </NumberField>

  <NumberField
    v-else-if="type === 'integer'"
    v-model="numericValue"
    :disabled="disabled"
    :format-options="{
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }"
    class="w-full"
  >
    <NumberFieldInput :class="cn('h-8 text-xs font-mono text-left px-3', props.class)" />
  </NumberField>

  <Input
    v-else-if="type === 'array'"
    v-model="modelValue"
    :disabled="disabled"
    :placeholder="placeholder || '值1,值2,值3'"
    :class="cn('h-8 text-xs font-mono', props.class)"
  />

  <Input
    v-else-if="type === 'object'"
    v-model="modelValue"
    :disabled="disabled"
    :placeholder="placeholder || objectPlaceholder"
    :class="cn('h-8 text-xs font-mono', props.class)"
  />

  <Input
    v-else
    v-model="modelValue"
    :disabled="disabled"
    :placeholder="placeholder"
    :class="cn('h-8 text-xs font-mono', props.class)"
  />
</template>
