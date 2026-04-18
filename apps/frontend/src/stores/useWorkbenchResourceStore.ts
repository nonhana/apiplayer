import type { ApiDetail } from '@/types/api'
import type { ApiVersionBrief, ApiVersionComparison, ApiVersionDetail } from '@/types/version'
import { defineStore } from 'pinia'
import { apiApi } from '@/api/api'
import { versionApi } from '@/api/version'

interface GetResourceOptions {
  force?: boolean
}

interface ResourceBucket<T> {
  cache: Map<string, T>
  inflight: Map<string, Promise<T>>
  versions: Map<string, number>
}

function createResourceBucket<T>(): ResourceBucket<T> {
  return {
    cache: new Map<string, T>(),
    inflight: new Map<string, Promise<T>>(),
    versions: new Map<string, number>(),
  }
}

function bumpResourceVersion<T>(bucket: ResourceBucket<T>, key: string) {
  const nextVersion = (bucket.versions.get(key) ?? 0) + 1
  bucket.versions.set(key, nextVersion)
  return nextVersion
}

function invalidateResource<T>(bucket: ResourceBucket<T>, key: string) {
  bucket.cache.delete(key)
  bucket.inflight.delete(key)
  bumpResourceVersion(bucket, key)
}

function resetResource<T>(bucket: ResourceBucket<T>) {
  bucket.cache.clear()
  bucket.inflight.clear()
  bucket.versions.clear()
}

function invalidateResourcesByPrefix<T>(bucket: ResourceBucket<T>, prefix: string) {
  const keys = new Set([
    ...bucket.cache.keys(),
    ...bucket.inflight.keys(),
  ])

  for (const key of keys) {
    if (key.startsWith(prefix)) {
      invalidateResource(bucket, key)
    }
  }
}

export const useWorkbenchResourceStore = defineStore('workbenchResource', () => {
  const apiDetailCache = createResourceBucket<ApiDetail>()
  const versionListCache = createResourceBucket<ApiVersionBrief[]>()
  const versionDetailCache = createResourceBucket<ApiVersionDetail>()
  const versionComparisonCache = createResourceBucket<ApiVersionComparison>()

  function apiDetailKey(projectId: string, apiId: string) {
    return `api-detail:${projectId}:${apiId}`
  }

  function versionListKey(projectId: string, apiId: string) {
    return `version-list:${projectId}:${apiId}`
  }

  function versionDetailKey(projectId: string, apiId: string, versionId: string) {
    return `version-detail:${projectId}:${apiId}:${versionId}`
  }

  function versionComparisonKey(projectId: string, apiId: string, fromVersionId: string, toVersionId: string) {
    return `version-compare:${projectId}:${apiId}:${fromVersionId}:${toVersionId}`
  }

  async function getResource<T>(
    bucket: ResourceBucket<T>,
    key: string,
    fetcher: () => Promise<T>,
    options: GetResourceOptions = {},
  ): Promise<T> {
    if (!options.force && bucket.cache.has(key)) {
      return bucket.cache.get(key)!
    }

    const inflight = bucket.inflight.get(key)
    if (!options.force && inflight) {
      return inflight
    }

    const requestVersion = options.force
      ? bumpResourceVersion(bucket, key)
      : bucket.versions.get(key) ?? 0

    const request = fetcher()
      .then((data) => {
        if ((bucket.versions.get(key) ?? 0) === requestVersion) {
          bucket.cache.set(key, data)
        }
        return data
      })
      .finally(() => {
        if (bucket.inflight.get(key) === request) {
          bucket.inflight.delete(key)
        }
      })

    if (!options.force) {
      bucket.inflight.set(key, request)
    }

    return request
  }

  function getApiDetail(projectId: string, apiId: string, options?: GetResourceOptions) {
    return getResource(
      apiDetailCache,
      apiDetailKey(projectId, apiId),
      () => apiApi.getApiDetail(projectId, apiId),
      options,
    )
  }

  function getVersionList(projectId: string, apiId: string, options?: GetResourceOptions) {
    return getResource(
      versionListCache,
      versionListKey(projectId, apiId),
      async () => {
        const response = await versionApi.getVersionList(projectId, apiId)
        return response.versions
      },
      options,
    )
  }

  function getVersionDetail(projectId: string, apiId: string, versionId: string, options?: GetResourceOptions) {
    return getResource(
      versionDetailCache,
      versionDetailKey(projectId, apiId, versionId),
      () => versionApi.getVersionDetail(projectId, apiId, versionId),
      options,
    )
  }

  function getVersionComparison(
    projectId: string,
    apiId: string,
    fromVersionId: string,
    toVersionId: string,
    options?: GetResourceOptions,
  ) {
    return getResource(
      versionComparisonCache,
      versionComparisonKey(projectId, apiId, fromVersionId, toVersionId),
      () => versionApi.compareVersions(projectId, apiId, fromVersionId, toVersionId),
      options,
    )
  }

  function invalidateApiDetail(projectId: string, apiId: string) {
    invalidateResource(apiDetailCache, apiDetailKey(projectId, apiId))
  }

  function invalidateVersionList(projectId: string, apiId: string) {
    invalidateResource(versionListCache, versionListKey(projectId, apiId))
  }

  function invalidateVersionDetail(projectId: string, apiId: string, versionId: string) {
    invalidateResource(versionDetailCache, versionDetailKey(projectId, apiId, versionId))
  }

  function invalidateVersionDetailsByApi(projectId: string, apiId: string) {
    invalidateResourcesByPrefix(versionDetailCache, `version-detail:${projectId}:${apiId}:`)
  }

  function invalidateVersionComparisonsByApi(projectId: string, apiId: string) {
    invalidateResourcesByPrefix(versionComparisonCache, `version-compare:${projectId}:${apiId}:`)
  }

  function invalidateApi(projectId: string, apiId: string) {
    invalidateApiDetail(projectId, apiId)
    invalidateVersionList(projectId, apiId)
    invalidateVersionDetailsByApi(projectId, apiId)
    invalidateVersionComparisonsByApi(projectId, apiId)
  }

  function reset() {
    resetResource(apiDetailCache)
    resetResource(versionListCache)
    resetResource(versionDetailCache)
    resetResource(versionComparisonCache)
  }

  return {
    apiDetailKey,
    versionListKey,
    versionDetailKey,
    versionComparisonKey,
    getApiDetail,
    getVersionList,
    getVersionDetail,
    getVersionComparison,
    invalidateApiDetail,
    invalidateVersionList,
    invalidateVersionDetail,
    invalidateVersionDetailsByApi,
    invalidateVersionComparisonsByApi,
    invalidateApi,
    reset,
  }
})
