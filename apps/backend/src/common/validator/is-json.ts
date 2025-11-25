import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

function isJsonValue(value: any): boolean {
  const t = typeof value

  // 1. 基本类型
  if (
    t === 'string'
    || t === 'number'
    || t === 'boolean'
    // || value === null // 对于 input JSON，不存在 null 的情况
  ) {
    return true
  }

  // 2. 遇上数组，则每个 item 执行递归校验
  if (Array.isArray(value)) {
    return value.every(isJsonValue)
  }

  // 3. 递归校验对象
  if (t === 'object') {
    if (value instanceof Date)
      return false
    if (value instanceof Map)
      return false
    if (value instanceof Set)
      return false

    return Object.values(value).every(isJsonValue)
  }

  return false
}

/** 自定义校验工具：是否是一个严格的 JSON 值 */
export function IsJsonValue(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isJsonValue',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _: ValidationArguments) {
          return value === undefined || isJsonValue(value)
        },
        defaultMessage() {
          return '参数 value 必须是合法的 JSON 值'
        },
      },
    })
  }
}
