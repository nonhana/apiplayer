import type { ConfigValueType, SystemConfigKey } from '@apiplayer/shared'
import type { JsonValue } from 'type-fest'

export type ConfigRecord = Record<SystemConfigKey, any>

export interface ConfigDetailItem<T extends JsonValue = JsonValue> {
  key: SystemConfigKey
  value: T
  defaultValue: T
  type: ConfigValueType
  description: string
  options?: T[]
}

export interface UpdateConfigReq<T extends JsonValue = JsonValue> {
  value: T
}

export type UpdateConfigsReq = Partial<Record<SystemConfigKey, JsonValue>>
