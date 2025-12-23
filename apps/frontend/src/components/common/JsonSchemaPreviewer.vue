<script lang="ts" setup>
import { computed } from 'vue'
import { schemaToNode } from '@/lib/json-schema'
import JsonSchemaPreviewNode from './JsonSchemaPreviewNode.vue'

const props = defineProps<{
  schema?: Record<string, unknown> | null
}>()

const node = computed(() => schemaToNode(props.schema ?? null))
</script>

<template>
  <div class="rounded-lg border bg-background overflow-hidden">
    <div
      v-if="node"
      class="overflow-auto"
    >
      <template v-if="node.type === 'object' && node.children">
        <JsonSchemaPreviewNode
          v-for="(child, index) in node.children"
          :key="index"
          :node="child"
          :depth="0"
          :default-expanded="true"
        />
      </template>

      <template v-else-if="node.type === 'array' && node.item">
        <JsonSchemaPreviewNode
          :node="node.item"
          :depth="0"
          :default-expanded="true"
        />
      </template>

      <template v-else>
        <JsonSchemaPreviewNode
          :node="node"
          :depth="0"
          :default-expanded="true"
        />
      </template>
    </div>

    <div
      v-else
      class="flex items-center justify-center py-8 text-sm text-muted-foreground"
    >
      暂无 Schema 定义
    </div>
  </div>
</template>
