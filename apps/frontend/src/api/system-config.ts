import type { SystemConfigKey } from '@apiplayer/shared'
import type {
  ConfigDetailItem,
  ConfigRecord,
  UpdateConfigReq,
  UpdateConfigsReq,
} from '@/types/system-config'
import http from '@/service'

export const systemConfigApi = {
  /** 获取系统配置 Record */
  getConfigs: () => {
    return http.get('system-config').json<ConfigRecord>()
  },

  /** 批量更新系统配置 */
  updateConfigs: (data: UpdateConfigsReq) => {
    return http.patch('system-config', { json: data }).json<void>()
  },

  /** 获取指定系统配置 */
  getConfigValue: (key: SystemConfigKey) => {
    return http.get(`system-config/${key}`).json<unknown>()
  },

  /** 更新指定系统配置 */
  updateConfig: (key: SystemConfigKey, data: UpdateConfigReq) => {
    return http.patch(`system-config/${key}`, { json: data }).json<void>()
  },

  /** 获取所有系统配置详细信息 */
  getConfigsDetail: () => {
    return http.get('system-config/all-with-metadata').json<ConfigDetailItem[]>()
  },
}
