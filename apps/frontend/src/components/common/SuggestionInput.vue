<script lang="ts" setup>
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
  /** 建议列表 */
  suggestions: string[]
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
  (e: 'update:modelValue', value: string): void
}>()

/** 下拉框是否打开 */
const open = ref(false)

/** 搜索关键词（用于过滤建议列表） */
const searchTerm = ref('')

/** 同步外部值到搜索框 */
watch(
  () => props.modelValue,
  (newValue) => {
    searchTerm.value = newValue
  },
  { immediate: true },
)

/** 过滤后的建议列表 */
const filteredSuggestions = computed(() => {
  const term = searchTerm.value.toLowerCase()
  if (!term)
    return props.suggestions
  return props.suggestions.filter(s => s.toLowerCase().includes(term))
})

/** 处理输入变化 */
function handleInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  searchTerm.value = target.value
  emit('update:modelValue', target.value)
}

/** 处理选择建议项 */
function handleSelect(value: unknown) {
  if (typeof value === 'string') {
    searchTerm.value = value
    emit('update:modelValue', value)
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
      v-if="open && filteredSuggestions.length > 0"
      class="max-h-[200px] overflow-y-auto p-1"
    >
      <ComboboxEmpty class="py-2 text-center text-sm text-muted-foreground">
        无匹配结果
      </ComboboxEmpty>

      <ComboboxItem
        v-for="suggestion in filteredSuggestions"
        :key="suggestion"
        :value="suggestion"
        class="cursor-pointer"
      >
        <span class="font-mono text-sm">{{ suggestion }}</span>
      </ComboboxItem>
    </ComboboxList>
  </Combobox>
</template>
