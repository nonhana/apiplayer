import type { LocalApiRequestBody, LocalApiResItem } from '@/components/workbench/api-editor/editor/types'
import type { ApiRequestBody, ApiResItem } from '@/types/api'
import { nodeToSchema, schemaToNode } from './json-schema'

/** ApiRequestBody -> LocalApiRequestBody */
export function toLocalReqBody(body: ApiRequestBody): LocalApiRequestBody {
  const { jsonSchema, ...rest } = body
  const result: LocalApiRequestBody = { ...rest }
  if (jsonSchema) {
    result.jsonSchema = schemaToNode(jsonSchema)
  }
  return result
}

/** LocalApiRequestBody -> ApiRequestBody */
export function toApiReqBody(body: LocalApiRequestBody): ApiRequestBody {
  const { jsonSchema, ...rest } = body
  const result: ApiRequestBody = { ...rest }
  if (jsonSchema) {
    result.jsonSchema = nodeToSchema(jsonSchema)
  }
  return result
}

/** ApiResItem[] -> LocalApiResItem[] */
export function toLocalResList(responses: ApiResItem[]): LocalApiResItem[] {
  return responses.map((response) => {
    const { body, ...rest } = response
    const res: LocalApiResItem = { ...rest }
    if (body) {
      res.body = schemaToNode(body)
    }
    return res
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
    return res
  })
}
