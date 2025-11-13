import { APIMethod, APIStatus } from '@prisma/client'

export class UpdateApiReqDto {

}

export class UpdateApiBaseInfoDto {
  name?: string
  description?: string
  method?: APIMethod
  status?: APIStatus
  path?: string
  tags?: string[]
  sortOrder?: number

  ownerId?: string
  groupId?: string

  requestHeaders?: Record<string, any>[]
  pathParams?: Record<string, any>[]
  queryParams?: Record<string, any>[]

  requestBody?: Record<string, any>
  responses?: Record<string, any>[]

  examples?: Record<string, any>

  mockConfig?: Record<string, any>
}
