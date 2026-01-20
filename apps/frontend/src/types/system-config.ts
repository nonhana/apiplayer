import type { ConfigValueType, SystemConfigKey } from '@apiplayer/shared'

export type ConfigRecord = Record<SystemConfigKey, any>

export interface ConfigDetailItem<T = any> {
  key: SystemConfigKey
  value: T
  defaultValue: T
  type: ConfigValueType
  description: string
  options?: T[]
}

export interface UpdateConfigReq<T = any> {
  value: T
}

export type UpdateConfigsReq = Partial<Record<SystemConfigKey, any>>
