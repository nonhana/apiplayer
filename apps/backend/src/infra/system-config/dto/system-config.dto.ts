import { Exclude, Expose } from 'class-transformer'
import { JsonValue } from 'type-fest'
import { ConfigValueType, SystemConfigKey } from '../system-config.types'

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
