<script lang="ts" setup>
import type { SchemaFieldType } from '@/lib/json-schema'
import type { LocalSchemaNode } from '@/types/json-schema'
import { ChevronRight } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  node: LocalSchemaNode
  depth?: number
  defaultExpanded?: boolean
}>(), {
  depth: 0,
  defaultExpanded: true,
})

const isExpanded = ref(props.defaultExpanded)

const currentDepth = computed(() => props.depth)

const paddingLeft = computed(() => `${currentDepth.value * 20 + 12}px`)

const isCollapsible = computed(() => {
  if (props.node.type === 'object') {
    return props.node.children && props.node.children.length > 0
  }
  if (props.node.type === 'array') {
    return !!props.node.item
  }
  return false
})

const typeColorClass = computed(() => {
  const typeColors: Record<SchemaFieldType, string> = {
    string: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    number: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    integer: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    boolean: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
    array: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    object: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    null: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
  }
  return typeColors[props.node.type] ?? typeColors.string
})

const typeDisplay = computed(() => {
  if (props.node.type === 'array' && props.node.item) {
    return `array<${props.node.item.type}>`
  }
  return props.node.type
})
</script>

<template>
  <Collapsible v-model:open="isExpanded" :disabled="!isCollapsible">
    <div
      class="flex items-start gap-2.5 p-2.5 hover:bg-muted transition-colors last:border-b-0"
      :style="{ paddingLeft }"
    >
      <div class="w-4 h-5 shrink-0 flex items-center justify-center">
        <CollapsibleTrigger
          v-if="isCollapsible"
          as-child
        >
          <button class="flex items-center justify-center w-4 h-4 rounded hover:bg-muted transition-colors">
            <ChevronRight
              :class="cn(
                'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                isExpanded && 'rotate-90',
              )"
            />
          </button>
        </CollapsibleTrigger>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <span
          v-if="node.isRoot"
          class="font-mono text-sm text-muted-foreground italic"
        >
          (root)
        </span>
        <span
          v-else-if="node.isArrayItem"
          class="font-mono text-sm text-violet-500 dark:text-violet-400"
        >
          ITEMS
        </span>
        <span
          v-else
          :class="cn(
            'font-mono text-sm font-medium',
            node.required && 'text-foreground',
            !node.required && 'text-muted-foreground',
          )"
        >
          {{ node.name }}
        </span>
      </div>

      <Badge
        variant="outline"
        :class="cn(
          'font-mono text-xs px-1.5 py-0 h-5 shrink-0',
          typeColorClass,
        )"
      >
        {{ typeDisplay }}
      </Badge>

      <div class="flex-1 flex items-center gap-2 min-w-0">
        <span
          v-if="node.description"
          class="text-sm text-muted-foreground truncate"
        >
          {{ node.description }}
        </span>
      </div>

      <Badge
        v-if="node.required && !node.isRoot && !node.isArrayItem"
        variant="destructive"
      >
        必需
      </Badge>
      <Badge
        v-else-if="!node.isRoot && !node.isArrayItem"
        variant="outline"
      >
        可选
      </Badge>
    </div>

    <CollapsibleContent>
      <template v-if="node.type === 'object' && node.children">
        <JsonSchemaPreviewNode
          v-for="(child, index) in node.children"
          :key="index"
          :node="child"
          :depth="currentDepth + 1"
          :default-expanded="currentDepth < 2"
        />
      </template>

      <template v-else-if="node.type === 'array' && node.item">
        <JsonSchemaPreviewNode
          :node="node.item"
          :depth="currentDepth + 1"
          :default-expanded="currentDepth < 2"
        />
      </template>
    </CollapsibleContent>
  </Collapsible>
</template>
