<script setup lang="ts">
import type { HTMLAttributes, InputTypeHTMLAttribute } from 'vue'
import { useVModel } from '@vueuse/core'
import { Eye, EyeOff } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'

interface BaseInputProps {
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
  placeholder?: string
}

type PasswordInputProps = BaseInputProps & {
  type: 'password'
  passwordToggle?: boolean
}

type NormalInputProps = BaseInputProps & {
  type?: Exclude<InputTypeHTMLAttribute, 'password'>
  passwordToggle?: never // 不是 password 类型，不允许填写 passwordToggle 属性
}

type InputProps = PasswordInputProps | NormalInputProps

const props = defineProps<InputProps>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
  (e: 'focus', event: Event): void
  (e: 'blur', event: Event): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const showPassword = ref(false)

const inputType = computed(() => {
  if (props.type === 'password' && props.passwordToggle) {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type ?? 'text'
})
</script>

<template>
  <div class="relative">
    <input
      v-model="modelValue"
      data-slot="input"
      :type="inputType"
      :class="cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        props.class,
      )"
      :placeholder="props.placeholder"
      @focus="(e) => emits('focus', e)"
      @blur="(e) => emits('blur', e)"
    >
    <button
      v-if="props.passwordToggle"
      type="button"
      class="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors user-select-none"
      :aria-label="showPassword ? '隐藏密码' : '显示密码'"
      @click="showPassword = !showPassword"
    >
      <EyeOff v-if="showPassword" class="h-4 w-4" />
      <Eye v-else class="h-4 w-4" />
    </button>
  </div>
</template>
