import type { JsonValue } from 'type-fest'
import { ConfigValueType, SystemConfigKey } from '@apiplayer/shared'
import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class SystemConfigItemDto {
  @Expose()
  key: SystemConfigKey

  @Expose()
  value: JsonValue

  @Expose()
  defaultValue: JsonValue

  @Expose()
  type: ConfigValueType

  @Expose()
  description: string

  @Expose()
  options?: JsonValue[]
}
