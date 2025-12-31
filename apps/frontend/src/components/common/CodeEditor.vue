<script lang="ts" setup>
import * as monaco from 'monaco-editor'
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import '@/lib/monaco'

type SupportedLanguage = 'json' | 'javascript' | 'typescript' | 'html' | 'css' | 'xml' | 'plaintext'

const props = withDefaults(defineProps<{
  language?: SupportedLanguage
  readonly?: boolean
  minHeight?: number
  placeholder?: string
}>(), {
  modelValue: '',
  language: 'json',
  readonly: false,
  minHeight: 320,
  placeholder: '',
})

const code = defineModel<string>({ required: true })

const containerRef = useTemplateRef('containerRef')

/** 编辑器实例（使用 shallowRef 避免深层响应式） */
const editorInstance = shallowRef<monaco.editor.IStandaloneCodeEditor>()

/** 是否正在内部更新（防止循环） */
let isInternalUpdate = false

function createEditor() {
  if (!containerRef.value)
    return

  editorInstance.value = monaco.editor.create(containerRef.value, {
    value: code.value,
    language: props.language,
    theme: 'vs', // 亮色主题，可以根据项目需要改成 'vs-dark'
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
    const value = editorInstance.value?.getValue() ?? ''
    code.value = value
  })
}

function disposeEditor() {
  editorInstance.value?.dispose()
  editorInstance.value = undefined
}

async function formatDocument() {
  await editorInstance.value?.getAction('editor.action.formatDocument')?.run()
}

function focus() {
  editorInstance.value?.focus()
}

watch(code, (newValue) => {
  const editor = editorInstance.value
  if (!editor)
    return

  // 如果值相同，不需要更新
  if (editor.getValue() === newValue)
    return

  // 标记为内部更新，避免触发 onDidChangeModelContent
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
  const el = containerRef.value
  if (!el)
    return

  el.addEventListener(
    'keydown',
    (e) => {
      e.stopPropagation()
    },
    true,
  )
})

onBeforeUnmount(() => {
  disposeEditor()
})

defineExpose({
  formatDocument,
  focus,
  getEditor: () => editorInstance.value,
})
</script>

<template>
  <div
    ref="containerRef"
    role="textbox"
    class="border rounded-md overflow-hidden"
    :style="{ minHeight: `${minHeight}px` }"
  />
</template>
