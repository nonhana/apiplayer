<script lang="ts" setup>
import type { AcceptableValue } from 'reka-ui'
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
  /** 绑定值 */
  modelValue?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义样式 */
  class?: HTMLAttributes['class']
  /** 占位符文本 */
  placeholder?: string
}>(), {
  modelValue: '',
  disabled: false,
  placeholder: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

/** 将字符串值转换为数字（用于 NumberField） */
const numericValue = computed({
  get: () => {
    const num = Number(props.modelValue)
    return Number.isNaN(num) ? undefined : num
  },
  set: (val: number | undefined) => {
    emit('update:modelValue', val === undefined ? '' : String(val))
  },
})

/** 处理文本输入更新 */
function handleTextUpdate(value: string | number) {
  emit('update:modelValue', String(value))
}

/** 处理布尔值选择更新 */
function handleBooleanUpdate(value: AcceptableValue) {
  if (value !== null && value !== undefined) {
    emit('update:modelValue', String(value))
  }
}

/** object 类型的占位符 */
const objectPlaceholder = '{"k": "v"}'
</script>

<template>
  <!-- file 类型：隐藏输入表单 -->
  <div v-if="type === 'file'" />

  <!-- boolean 类型：下拉选择 true/false -->
  <Select
    v-else-if="type === 'boolean'"
    :model-value="modelValue || undefined"
    :disabled="disabled"
    @update:model-value="handleBooleanUpdate"
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

  <!-- number 类型：数字输入（允许小数） -->
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

  <!-- integer 类型：整数输入 -->
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

  <!-- array 类型：文本输入（用逗号分隔） -->
  <Input
    v-else-if="type === 'array'"
    :model-value="modelValue"
    :disabled="disabled"
    :placeholder="placeholder || '值1,值2,值3'"
    :class="cn('h-8 text-xs font-mono', props.class)"
    @update:model-value="handleTextUpdate"
  />

  <!-- object 类型：文本输入（JSON 格式） -->
  <Input
    v-else-if="type === 'object'"
    :model-value="modelValue"
    :disabled="disabled"
    :placeholder="placeholder || objectPlaceholder"
    :class="cn('h-8 text-xs font-mono', props.class)"
    @update:model-value="handleTextUpdate"
  />

  <!-- string 及其他类型：普通文本输入 -->
  <Input
    v-else
    :model-value="modelValue"
    :disabled="disabled"
    :placeholder="placeholder"
    :class="cn('h-8 text-xs font-mono', props.class)"
    @update:model-value="handleTextUpdate"
  />
</template>
