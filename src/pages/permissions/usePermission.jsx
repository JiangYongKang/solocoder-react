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

export function withPermission(WrappedComponent, permissionIds, { mode = 'all', hide = true } = {}) {
  return function PermissionWrapper(props) {
    const { currentUserId, users, roles } = props
    if (!currentUserId || !users || !roles) {
      return hide ? null : (
        <span style={{ opacity: 0.5, pointerEvents: 'none' }}>
          <WrappedComponent {...props} />
        </span>
      )
    }
    const perms = getUserPermissions(currentUserId, users, roles)
    const hasAccess = Array.isArray(permissionIds)
      ? mode === 'all'
        ? permissionIds.every((p) => perms.includes(p))
        : permissionIds.some((p) => perms.includes(p))
      : perms.includes(permissionIds)

    if (!hasAccess) {
      return hide ? null : (
        <span style={{ opacity: 0.5, pointerEvents: 'none' }}>
          <WrappedComponent {...props} />
        </span>
      )
    }
    return <WrappedComponent {...props} />
  }
}
