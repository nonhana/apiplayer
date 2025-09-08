export const projectEnvType = ['DEV', 'TEST', 'STAGING', 'PROD', 'MOCK'] as const

export type ProjectEnvType = (typeof projectEnvType)[number]
