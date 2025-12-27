import type { LocalApiRequestBody, LocalApiResItem } from '@/components/workbench/api-editor/editor/types'
import type { ApiRequestBody, ApiResItem } from '@/types/api'
import { cloneDeep } from 'lodash-es'
import { nodeToSchema, schemaToNode } from './json-schema'

/** ApiRequestBody -> LocalApiRequestBody */
export function toLocalReqBody(body: ApiRequestBody): LocalApiRequestBody {
  const { jsonSchema, ...rest } = body
  const res: LocalApiRequestBody = { ...rest }
  if (jsonSchema) {
    res.jsonSchema = schemaToNode(jsonSchema)
  }
  return cloneDeep(res)
}

/** LocalApiRequestBody -> ApiRequestBody */
export function toApiReqBody(body: LocalApiRequestBody): ApiRequestBody {
  const { jsonSchema, ...rest } = body
  const res: ApiRequestBody = { ...rest }
  if (jsonSchema) {
    res.jsonSchema = nodeToSchema(jsonSchema)
  }
  return cloneDeep(res)
}

/** ApiResItem[] -> LocalApiResItem[] */
export function toLocalResList(responses: ApiResItem[]): LocalApiResItem[] {
  return responses.map((response) => {
    const { body, ...rest } = response
    const res: LocalApiResItem = { ...rest }
    if (body) {
      res.body = schemaToNode(body)
    }
    return cloneDeep(res)
  })
}

/** LocalApiResItem[] -> ApiResItem[] */
export function toApiResList(responses: LocalApiResItem[]): ApiResItem[] {
  return responses.map((response) => {
    const { body, ...rest } = response
    const res: ApiResItem = { ...rest }
    if (body) {
      res.body = nodeToSchema(body)
    }
    return cloneDeep(res)
  })
}
