export const PROJECT_ENV = ['DEV', 'TEST', 'STAGING', 'PROD', 'MOCK'] as const

export type ProjectEnvType = (typeof PROJECT_ENV)[number]
