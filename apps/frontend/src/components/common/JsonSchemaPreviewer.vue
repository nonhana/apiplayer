<script lang="ts" setup>
import { computed } from 'vue'
import { schemaToNode } from '@/lib/json-schema'
import CodeBlock from './CodeBlock.vue'
import JsonSchemaPreviewNode from './JsonSchemaPreviewNode.vue'

const props = defineProps<{
  schema?: Record<string, unknown> | null
}>()

const node = computed(() => schemaToNode(props.schema ?? null))

const exampleJson = computed(() => {
  if (!Array.isArray(props.schema?.examples) || props.schema?.examples.length === 0)
    return ''

  return JSON.stringify(props.schema.examples[0], null, 2)
})
</script>

<template>
  <div class="rounded-lg border bg-background overflow-hidden">
    <div v-if="node" class="overflow-auto">
      <JsonSchemaPreviewNode
        :node="node"
        :depth="0"
        :default-expanded="true"
      />
    </div>

    <div
      v-else
      class="flex items-center justify-center py-8 text-sm text-muted-foreground"
    >
      暂无 Schema 定义
    </div>

    <div v-if="exampleJson" class="border-t">
      <CodeBlock
        :code="exampleJson"
        lang="json"
        :show-header="true"
        max-height="280px"
        class="rounded-none border-0"
      />
    </div>
  </div>
</template>
