<script lang="ts" setup>
import type { Option } from '@/types'
import { computed, ref, watch } from 'vue'
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import Input from '@/components/ui/input/Input.vue'

const props = withDefaults(defineProps<{
  /** 当前值 */
  modelValue: string
  /** 选项列表 */
  options: Option[]
  /** 占位符 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 输入框样式类 */
  class?: string
}>(), {
  placeholder: '',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

/** 下拉框是否打开 */
const open = ref(false)

/** 搜索关键词（用于过滤选项列表） */
const searchTerm = ref('')

/** 同步外部值到搜索框 */
watch(
  () => props.modelValue,
  (newValue) => {
    searchTerm.value = newValue
  },
  { immediate: true },
)

/** 过滤后的选项列表 */
const filteredOptions = computed(() => {
  const term = searchTerm.value.toLowerCase()
  if (!term)
    return props.options
  return props.options.filter(s => s.label.toLowerCase().includes(term))
})

/** 处理输入变化 */
function handleInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  searchTerm.value = target.value
  emit('update:modelValue', target.value)
}

/** 类型守卫，验证 item 是否为 Option */
function isOption(item: unknown): item is Option {
  return typeof item === 'object' && item !== null && 'label' in item && 'value' in item
}

/** 处理选择选项项 */
function handleSelect(item: unknown) {
  if (isOption(item)) {
    searchTerm.value = item.label
    emit('update:modelValue', item.value)
    open.value = false
  }
}
</script>

<template>
  <Combobox
    v-model:open="open"
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="handleSelect"
  >
    <ComboboxAnchor as-child>
      <ComboboxInput
        as-child
        @input="handleInputChange"
      >
        <Input
          :model-value="searchTerm"
          :placeholder="placeholder"
          :disabled="disabled"
          @focus="open = true"
        />
      </ComboboxInput>
    </ComboboxAnchor>

    <ComboboxList
      v-if="open && filteredOptions.length > 0"
      class="max-h-[200px] overflow-y-auto p-1"
    >
      <ComboboxEmpty class="py-2 text-center text-sm text-muted-foreground">
        无匹配结果
      </ComboboxEmpty>

      <ComboboxItem
        v-for="option in filteredOptions"
        :key="option.label"
        :value="option"
        class="cursor-pointer"
      >
        <span class="font-mono text-sm">{{ option.label }}</span>
      </ComboboxItem>
    </ComboboxList>
  </Combobox>
</template>
