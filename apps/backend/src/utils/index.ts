/** 将 null 转换为 undefined */
export function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}
