<script lang="ts" setup>
import type { SupportedLanguage } from '@/types/code-editor'
import * as monaco from 'monaco-editor'
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import '@/lib/monaco'

const props = withDefaults(defineProps<{
  language?: SupportedLanguage
  readonly?: boolean
  minHeight?: number
}>(), {
  language: 'json',
  readonly: false,
  minHeight: 320,
})

const emit = defineEmits<{
  (e: 'ready', editor: monaco.editor.IStandaloneCodeEditor): void
  (e: 'focus'): void
  (e: 'blur'): void
}>()

const code = defineModel<string>({ default: '' })

const containerRef = useTemplateRef('containerRef')

/** 编辑器实例（避免深层响应式） */
const editorInstance = shallowRef<monaco.editor.IStandaloneCodeEditor>()

/** 是否正在内部更新（防止循环） */
let isInternalUpdate = false

function createEditor() {
  if (!containerRef.value)
    return

  try {
    editorInstance.value = monaco.editor.create(containerRef.value, {
      value: code.value,
      language: props.language,
      theme: 'vs',
      readOnly: props.readonly,
      minimap: { enabled: false },
      fontSize: 13,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      folding: true,
      formatOnPaste: true,
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },
      padding: { top: 8, bottom: 8 },
      acceptSuggestionOnEnter: 'on',
    })

    editorInstance.value.onDidChangeModelContent(() => {
      if (isInternalUpdate)
        return
      code.value = editorInstance.value?.getValue() ?? ''
    })

    editorInstance.value.onDidFocusEditorWidget(() => emit('focus'))
    editorInstance.value.onDidBlurEditorWidget(() => emit('blur'))

    emit('ready', editorInstance.value)
  }
  catch (error) {
    console.error('[CodeEditor] 编辑器创建失败:', error)
  }
}

function disposeEditor() {
  editorInstance.value?.dispose()
  editorInstance.value = undefined
}

async function formatDocument(): Promise<boolean> {
  try {
    await editorInstance.value?.getAction('editor.action.formatDocument')?.run()
    return true
  }
  catch (error) {
    console.warn('[CodeEditor] 格式化失败:', error)
    return false
  }
}

function focus() {
  editorInstance.value?.focus()
}

function getValue(): string {
  return editorInstance.value?.getValue() ?? ''
}

function setValue(value: string) {
  if (!editorInstance.value)
    return
  isInternalUpdate = true
  editorInstance.value.setValue(value)
  isInternalUpdate = false
}

watch(code, (newValue) => {
  const editor = editorInstance.value
  if (!editor)
    return

  if (editor.getValue() === newValue)
    return

  isInternalUpdate = true
  editor.setValue(newValue)
  isInternalUpdate = false
})

watch(
  () => props.language,
  (newLang) => {
    const model = editorInstance.value?.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, newLang)
    }
  },
)

watch(
  () => props.readonly,
  (newReadonly) => {
    editorInstance.value?.updateOptions({ readOnly: newReadonly })
  },
)

onMounted(() => {
  createEditor()
})

onBeforeUnmount(() => {
  disposeEditor()
})

defineExpose({
  formatDocument,
  focus,
  getEditor: () => editorInstance.value,
  getValue,
  setValue,
})
</script>

<template>
  <section class="border rounded-md overflow-hidden">
    <div
      ref="containerRef"
      :style="{ minHeight: `${minHeight}px` }"
    />
  </section>
</template>
