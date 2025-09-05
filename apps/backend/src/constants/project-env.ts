export const PROJECT_ENV_TYPE = ['DEV', 'TEST', 'STAGING', 'PROD', 'MOCK'] as const

export type ProjectEnvType = (typeof PROJECT_ENV_TYPE)[number]
