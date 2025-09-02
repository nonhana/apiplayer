export class PermissionContextDto {
  type: 'team' | 'project' | 'system'
  id?: string // teamId or projectId
}
