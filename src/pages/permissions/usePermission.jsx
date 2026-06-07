import { useMemo } from 'react'
import { getUserPermissions } from './utils'

export function usePermission(currentUserId, users, roles) {
  const permissions = useMemo(
    () => getUserPermissions(currentUserId, users, roles),
    [currentUserId, users, roles]
  )

  const check = useMemo(
    () => (permissionId) => permissions.includes(permissionId),
    [permissions]
  )

  const checkAny = useMemo(
    () => (permissionIds) => permissionIds.some((p) => permissions.includes(p)),
    [permissions]
  )

  const checkAll = useMemo(
    () => (permissionIds) => permissionIds.every((p) => permissions.includes(p)),
    [permissions]
  )

  return {
    permissions,
    can: check,
    canAny: checkAny,
    canAll: checkAll,
  }
}
