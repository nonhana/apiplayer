<script lang="ts" setup>
import type { ApiDetail } from '@/types/api'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import ApiBasicInfo from './doc/ApiBasicInfo.vue'
import ApiMetadata from './doc/ApiMetadata.vue'
import ApiRequestBody from './doc/ApiRequestBody.vue'
import ApiRequestParams from './doc/ApiRequestParams.vue'
import ApiResponses from './doc/ApiResponses.vue'

defineProps<{
  api: ApiDetail
}>()
</script>

<template>
  <ScrollArea class="h-full">
    <div class="w-full p-6 space-y-8">
      <div class="flex gap-6">
        <div class="flex-1 min-w-0 space-y-8">
          <ApiBasicInfo :api="api" />
          <Separator />
          <ApiRequestParams
            :headers="api.requestHeaders"
            :path-params="api.pathParams"
            :query-params="api.queryParams"
          />
          <Separator />
          <ApiRequestBody :body="api.requestBody" />
          <Separator />
          <ApiResponses :responses="api.responses" />
        </div>
        <div class="w-64 shrink-0">
          <div class="sticky top-6">
            <ApiMetadata :api="api" />
          </div>
        </div>
      </div>
    </div>
  </ScrollArea>
</template>
