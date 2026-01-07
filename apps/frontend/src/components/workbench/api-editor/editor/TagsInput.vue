<script lang="ts" setup>
import { X } from 'lucide-vue-next'
import { ref } from 'vue'
import { Badge } from '@/components/ui/badge'

const props = withDefaults(defineProps<{
  placeholder?: string
  maxTags?: number
  maxLength?: number
  disabled?: boolean
}>(), {
  placeholder: '输入标签后按回车添加',
  maxTags: 10,
  maxLength: 16,
  disabled: false,
})

const tags = defineModel<string[]>('tags', { required: true })

const inputValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function addTag(tag: string) {
  const trimmed = tag.trim()

  if (!trimmed)
    return
  if (trimmed.length > props.maxLength)
    return
  if (tags.value.length >= props.maxTags)
    return
  if (tags.value.includes(trimmed))
    return

  tags.value.push(trimmed)
  inputValue.value = ''
}

function removeTag(index: number) {
  if (props.disabled)
    return

  tags.value.splice(index, 1)
}

function handleKeydown(e: KeyboardEvent) {
  if (props.disabled)
    return

  if (e.key === 'Enter') {
    e.preventDefault()
    addTag(inputValue.value)
  }

  if (e.key === 'Backspace' && !inputValue.value && tags.value.length > 0) {
    removeTag(tags.value.length - 1)
  }
}

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
    <Badge
      v-for="(tag, index) in tags"
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

    <input
      ref="inputRef"
      v-model="inputValue"
      type="text"
      :placeholder="tags.length === 0 ? placeholder : ''"
      :disabled="disabled || tags.length >= maxTags"
      :maxlength="maxLength"
      class="flex-1 min-w-[120px] h-6 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
      @keydown="handleKeydown"
      @paste="handlePaste"
    >

    <span
      v-if="tags.length > 0"
      class="text-xs text-muted-foreground ml-auto"
    >
      {{ tags.length }}/{{ maxTags }}
    </span>
  </div>
</template>
