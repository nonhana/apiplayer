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

const bindValue = defineModel<string | number>({ required: true })

const open = ref(false)
const keyword = ref('')

function getDisplayLabel(val: string | number) {
  const option = props.options.find(opt => opt.value === val)
  return option ? option.label : String(val)
}

// 同步外部值到搜索框，显示 label
watch(
  [bindValue, () => props.options],
  ([newV]) => {
    if (!open.value) {
      keyword.value = getDisplayLabel(newV)
    }
  },
  { immediate: true },
)

const filteredOptions = computed(() => {
  const term = keyword.value.toLowerCase()
  if (!term)
    return props.options
  return props.options.filter(s => s.label.toLowerCase().includes(term))
})

function handleInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  keyword.value = target.value
  bindValue.value = target.value
}

function handleSelect(item: Option) {
  keyword.value = item.label
  bindValue.value = item.value
  open.value = false
}

// 失焦时，恢复显示当前 bindValue 对应的 label
function handleBlur() {
  // 确保先触发 select
  setTimeout(() => {
    if (!open.value) {
      keyword.value = getDisplayLabel(bindValue.value)
    }
  }, 150)
}
</script>

<template>
  <Combobox
    v-model:open="open"
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="handleSelect($event as Option)"
  >
    <ComboboxAnchor as-child>
      <ComboboxInput
        as-child
        @input="handleInputChange"
      >
        <Input
          :model-value="keyword"
          :placeholder="placeholder"
          :disabled="disabled"
          @focus="open = true"
          @blur="handleBlur"
        />
      </ComboboxInput>
    </ComboboxAnchor>

    <ComboboxList
      v-if="open && filteredOptions.length > 0"
      class="max-h-50 overflow-y-auto p-1"
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
