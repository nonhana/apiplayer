export const systemConfigs = [
  {
    key: 'registration.enabled',
    value: true,
    description: '是否允许用户注册',
  },
  {
    key: 'registration.email_verification',
    value: false,
    description: '注册时是否需要邮箱验证',
  },
  {
    key: 'team.max_members',
    value: 50,
    description: '团队最大成员数量',
  },
  {
    key: 'team.invite_mode',
    value: 'direct',
    description: '团队邀请模式: direct(直接添加) | email(邮箱邀请)',
  },
  {
    key: 'project.max_apis',
    value: 1000,
    description: '单个项目最大 API 数量',
  },
  {
    key: 'api.max_versions',
    value: 100,
    description: '单个 API 最大版本数量',
  },
  {
    key: 'version.auto_increment',
    value: true,
    description: '是否自动递增版本号',
  },
] as const

export type SystemConfigType = (typeof systemConfigs)[number]['key']

/** 团队邀请模式类型 */
export type TeamInviteMode = 'direct' | 'email'
