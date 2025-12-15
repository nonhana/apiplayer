<script lang="ts" setup>
/**
 * 标签输入组件
 * 支持添加、删除标签，类似 ApiFox 的标签输入
 */
import { X } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { Badge } from '@/components/ui/badge'

const props = withDefaults(defineProps<{
  /** 标签列表 */
  tags: string[]
  /** 占位符 */
  placeholder?: string
  /** 最大标签数 */
  maxTags?: number
  /** 最大标签长度 */
  maxLength?: number
  /** 是否禁用 */
  disabled?: boolean
}>(), {
  placeholder: '输入标签后按回车添加',
  maxTags: 10,
  maxLength: 16,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:tags', tags: string[]): void
}>()

/** 内部标签列表 */
const internalTags = ref<string[]>([])

/** 输入框内容 */
const inputValue = ref('')

/** 输入框 ref */
const inputRef = ref<HTMLInputElement | null>(null)

/** 同步外部数据 */
watch(
  () => props.tags,
  (newTags) => {
    internalTags.value = [...newTags]
  },
  { immediate: true },
)

/** 通知变化 */
function emitChange() {
  emit('update:tags', [...internalTags.value])
}

/** 添加标签 */
function addTag(tag: string) {
  const trimmed = tag.trim()

  if (!trimmed)
    return
  if (trimmed.length > props.maxLength)
    return
  if (internalTags.value.length >= props.maxTags)
    return
  if (internalTags.value.includes(trimmed))
    return

  internalTags.value.push(trimmed)
  inputValue.value = ''
  emitChange()
}

/** 删除标签 */
function removeTag(index: number) {
  if (props.disabled)
    return

  internalTags.value.splice(index, 1)
  emitChange()
}

/** 处理键盘事件 */
function handleKeydown(e: KeyboardEvent) {
  if (props.disabled)
    return

  if (e.key === 'Enter') {
    e.preventDefault()
    addTag(inputValue.value)
  }

  // Backspace 删除最后一个标签
  if (e.key === 'Backspace' && !inputValue.value && internalTags.value.length > 0) {
    removeTag(internalTags.value.length - 1)
  }
}

/** 处理粘贴（支持逗号分隔的多个标签） */
function handlePaste(e: ClipboardEvent) {
  if (props.disabled)
    return

  const text = e.clipboardData?.getData('text')
  if (!text)
    return

  const tags = text.split(/[,，\s]+/).filter(Boolean)
  if (tags.length > 1) {
    e.preventDefault()
    for (const tag of tags) {
      addTag(tag)
    }
  }
}

/** 点击容器聚焦输入框 */
function focusInput() {
  inputRef.value?.focus()
}
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-1.5 p-2 min-h-[40px] border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring cursor-text"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
    @click="focusInput"
  >
    <!-- 标签列表 -->
    <Badge
      v-for="(tag, index) in internalTags"
      :key="tag"
      variant="secondary"
      class="gap-1 pr-1 text-xs"
    >
      {{ tag }}
      <button
        v-if="!disabled"
        class="hover:bg-muted rounded p-0.5 -mr-0.5"
        @click.stop="removeTag(index)"
      >
        <X class="h-3 w-3" />
      </button>
    </Badge>

    <!-- 输入框 -->
    <input
      ref="inputRef"
      v-model="inputValue"
      type="text"
      :placeholder="internalTags.length === 0 ? placeholder : ''"
      :disabled="disabled || internalTags.length >= maxTags"
      :maxlength="maxLength"
      class="flex-1 min-w-[120px] h-6 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
      @keydown="handleKeydown"
      @paste="handlePaste"
    >

    <!-- 计数提示 -->
    <span
      v-if="internalTags.length > 0"
      class="text-xs text-muted-foreground ml-auto"
    >
      {{ internalTags.length }}/{{ maxTags }}
    </span>
  </div>
</template>
