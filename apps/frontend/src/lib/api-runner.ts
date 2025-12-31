import type { ApiParam } from '@/types/api'
import type { CurlOptions, RuntimeParam } from '@/types/proxy'
import { nanoid } from 'nanoid'

/** 将 API 参数转换为运行时参数 */
export function convertToRuntimeParam(param: ApiParam, fromDefinition: boolean): RuntimeParam {
  return {
    id: nanoid(),
    name: param.name,
    value: param.example ?? param.defaultValue ?? '',
    enabled: true,
    fromDefinition,
    type: param.type,
    description: param.description,
  }
}

/** 创建空的运行时参数 */
export function createEmptyRuntimeParam(): RuntimeParam {
  return {
    id: nanoid(),
    name: '',
    value: '',
    enabled: true,
    fromDefinition: false,
  }
}

/** 生成 cURL 命令 */
export function generateCurl(options: CurlOptions): string {
  // 将 ' 替换为 '\''
  const escapeShellArg = (arg: string) => `'${arg.replace(/'/g, '\'\\\'\'')}'`

  const parts: string[] = [`curl -X ${options.method}`]

  parts.push(escapeShellArg(options.url))

  for (const [key, value] of Object.entries(options.headers)) {
    parts.push(`-H ${escapeShellArg(`${key}: ${value}`)}`)
  }

  if (options.body && !['GET', 'HEAD'].includes(options.method)) {
    parts.push(`--data-raw ${escapeShellArg(options.body)}`)
  }

  parts.push('--compressed')

  return parts.join(' \\\n  ')
}
