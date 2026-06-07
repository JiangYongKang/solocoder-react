import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './index.css'
import UserEditPanel from './UserEditPanel'
import RoleEditModal from './RoleEditModal'
import { usePermission } from './usePermission'
import {
  loadUsers,
  saveUsers,
  loadRoles,
  saveRoles,
  loadCurrentUserId,
  saveCurrentUserId,
  createUser,
  updateUser,
  deleteUser,
  ensureMinimumUsers,
  ensureMinimumRoles,
  createRole,
  updateRole,
  deleteRole,
  getUserList,
  getRoleList,
  getUserRoleNames,
  formatDateTime,
} from './utils'

const TABS = [
  { key: 'users', label: '用户管理' },
  { key: 'roles', label: '角色管理' },
]

export default function PermissionsPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState(() => {
    const loaded = loadUsers()
    const ensured = ensureMinimumUsers(loaded)
    if (ensured.reset) {
      queueMicrotask(() => saveUsers(ensured.users))
    }
    return ensured.users
  })
  const [roles, setRoles] = useState(() => {
    const loaded = loadRoles()
    const ensured = ensureMinimumRoles(loaded)
    if (ensured.reset) {
      queueMicrotask(() => saveRoles(ensured.roles))
    }
    return ensured.roles
  })
  const [currentUserId, setCurrentUserId] = useState(() => loadCurrentUserId())

  const [activeTab, setActiveTab] = useState('users')

  const [userKeyword, setUserKeyword] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [editingUser, setEditingUser] = useState(null)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [userDeleteConfirm, setUserDeleteConfirm] = useState(null)

  const [roleKeyword, setRoleKeyword] = useState('')
  const [rolePage, setRolePage] = useState(1)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [roleDeleteConfirm, setRoleDeleteConfirm] = useState(null)

  const [errorMessage, setErrorMessage] = useState('')
  const errorTimer = useRef(null)

  const showError = useCallback((msg) => {
    setErrorMessage(msg)
    if (errorTimer.current) {
      clearTimeout(errorTimer.current)
    }
    errorTimer.current = setTimeout(() => {
      setErrorMessage('')
    }, 3000)
  }, [])

  useEffect(() => {
    return () => {
      if (errorTimer.current) {
        clearTimeout(errorTimer.current)
      }
    }
  }, [])

  const perm = usePermission(currentUserId, users, roles)

  const handleUsersUpdate = (next) => {
    setUsers(next)
    queueMicrotask(() => saveUsers(next))
  }

  const handleRolesUpdate = (next) => {
    setRoles(next)
    queueMicrotask(() => saveRoles(next))
  }

  const handleCurrentUserChange = (userId) => {
    setCurrentUserId(userId)
    saveCurrentUserId(userId)
  }

  const userPagination = useMemo(
    () => getUserList(users, { keyword: userKeyword, page: userPage }),
    [users, userKeyword, userPage]
  )

  const rolePagination = useMemo(
    () => getRoleList(roles, { keyword: roleKeyword, page: rolePage }),
    [roles, roleKeyword, rolePage]
  )

  const handleOpenCreateUser = () => {
    if (!perm.can('user:edit')) return
    setCreatingUser(true)
    setEditingUser(null)
    setUserModalOpen(true)
  }

  const handleOpenEditUser = (user) => {
    if (!perm.can('user:edit')) return
    setCreatingUser(false)
    setEditingUser(user)
    setUserModalOpen(true)
  }

  const handleUserSave = (userId, formData) => {
    let result
    if (creatingUser) {
      result = createUser(users, formData)
      if (result.success) {
        handleUsersUpdate(result.users)
        setUserModalOpen(false)
        setCreatingUser(false)
      }
    } else {
      result = updateUser(users, userId, formData)
      if (result.success) {
        handleUsersUpdate(result.users)
        setUserModalOpen(false)
        setEditingUser(null)
      }
    }
    return result
  }

  const handleUserDelete = () => {
    if (!userDeleteConfirm) return
    const result = deleteUser(users, userDeleteConfirm.id)
    if (result.success) {
      const ensured = ensureMinimumUsers(result.users)
      handleUsersUpdate(ensured.users)
      const targetUserId = currentUserId === userDeleteConfirm.id
        ? (ensured.users[0] ? ensured.users[0].id : currentUserId)
        : currentUserId
      if (targetUserId !== currentUserId) {
        handleCurrentUserChange(targetUserId)
      }
      setUserDeleteConfirm(null)
    } else {
      showError(result.error || '删除用户失败')
    }
  }

  const handleOpenCreateRole = () => {
    if (!perm.can('role:edit')) return
    setEditingRole(null)
    setRoleModalOpen(true)
  }

  const handleOpenEditRole = (role) => {
    if (!perm.can('role:edit')) return
    setEditingRole(role)
    setRoleModalOpen(true)
  }

  const handleRoleSave = (roleId, formData) => {
    let result
    if (roleId) {
      result = updateRole(roles, roleId, formData)
      if (result.success) {
        handleRolesUpdate(result.roles)
        setRoleModalOpen(false)
        setEditingRole(null)
      }
    } else {
      result = createRole(roles, formData)
      if (result.success) {
        handleRolesUpdate(result.roles)
        setRoleModalOpen(false)
      }
    }
    return result
  }

  const handleRoleDelete = () => {
    if (!roleDeleteConfirm) return
    const result = deleteRole(roles, roleDeleteConfirm.id, users)
    if (result.success) {
      const ensuredRoles = ensureMinimumRoles(result.roles)
      handleRolesUpdate(ensuredRoles.roles)
      handleUsersUpdate(result.users)
      setRoleDeleteConfirm(null)
    } else {
      showError(result.error || '删除角色失败')
    }
  }

  const renderPagination = (pagination, setPage) => {
    const { total, totalPage, currentPage, pageSize } = pagination
    const pages = []
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPage, start + 4)
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return (
      <div className="pagination">
        <div className="pagination-info">
          共 {total} 条，每页 {pageSize} 条
        </div>
        <div className="pagination-controls">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            上一页
          </button>
          {pages.map((p) => (
            <button
              key={p}
              className={`page-btn ${p === currentPage ? 'active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="page-btn"
            disabled={currentPage === totalPage}
            onClick={() => setPage(currentPage + 1)}
          >
            下一页
          </button>
        </div>
      </div>
    )
  }

  const currentUser = users.find((u) => u.id === currentUserId)

  return (
    <div className="permissions-page">
      <div className="page-header">
        <button className="btn btn-back" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="page-title">权限管理系统</h1>
        <div className="current-user-select">
          <span className="current-user-label">模拟登录：</span>
          <select
            className="form-inline-select"
            value={currentUserId}
            onChange={(e) => handleCurrentUserChange(e.target.value)}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentUser && (
        <div className="current-user-info">
          <span>
            当前用户：<strong>{currentUser.username}</strong>
          </span>
          <span>
            角色：{getUserRoleNames(currentUser, roles).join('、') || '无'}
          </span>
          <span>
            权限数：{perm.permissions.length}
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="error-toast" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="tab-content">
          <div className="toolbar">
            <div className="toolbar-left">
              <input
                className="form-input search-input"
                type="text"
                placeholder="搜索用户名或邮箱..."
                value={userKeyword}
                onChange={(e) => {
                  setUserKeyword(e.target.value)
                  setUserPage(1)
                }}
              />
            </div>
            <div className="toolbar-right">
              {perm.can('user:edit') && (
                <button
                  className="btn btn-primary"
                  onClick={handleOpenCreateUser}
                >
                  + 新增用户
                </button>
              )}
              {!perm.can('user:edit') && (
                <button className="btn btn-primary" disabled title="无权限">
                  + 新增用户
                </button>
              )}
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>邮箱</th>
                  <th>所属角色</th>
                  <th>创建时间</th>
                  <th className="col-actions">操作</th>
                </tr>
              </thead>
              <tbody>
                {userPagination.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-row">
                      <div className="empty-state">暂无数据</div>
                    </td>
                  </tr>
                ) : (
                  userPagination.items.map((user) => (
                    <tr
                      key={user.id}
                      className="data-row"
                      onClick={() => handleOpenEditUser(user)}
                    >
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <div className="role-tags">
                          {getUserRoleNames(user, roles).length === 0 ? (
                            <span className="role-tag role-tag-muted">未分配</span>
                          ) : (
                            getUserRoleNames(user, roles).map((name) => (
                              <span key={name} className="role-tag">
                                {name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td>{formatDateTime(user.createdAt)}</td>
                      <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                        {perm.can('user:edit') && (
                          <button
                            className="btn-link btn-link-primary"
                            onClick={() => handleOpenEditUser(user)}
                          >
                            编辑
                          </button>
                        )}
                        {perm.can('user:delete') && (
                          <button
                            className={`btn-link btn-link-danger ${users.length <= 1 ? 'disabled' : ''}`}
                            disabled={users.length <= 1}
                            onClick={() => users.length > 1 && setUserDeleteConfirm(user)}
                          >
                            删除
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {renderPagination(userPagination, setUserPage)}
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="tab-content">
          <div className="toolbar">
            <div className="toolbar-left">
              <input
                className="form-input search-input"
                type="text"
                placeholder="搜索角色名称或描述..."
                value={roleKeyword}
                onChange={(e) => {
                  setRoleKeyword(e.target.value)
                  setRolePage(1)
                }}
              />
            </div>
            <div className="toolbar-right">
              {perm.can('role:edit') && (
                <button
                  className="btn btn-primary"
                  onClick={handleOpenCreateRole}
                >
                  + 新增角色
                </button>
              )}
              {!perm.can('role:edit') && (
                <button className="btn btn-primary" disabled title="无权限">
                  + 新增角色
                </button>
              )}
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>角色名称</th>
                  <th>描述</th>
                  <th>权限数</th>
                  <th>创建时间</th>
                  <th className="col-actions">操作</th>
                </tr>
              </thead>
              <tbody>
                {rolePagination.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-row">
                      <div className="empty-state">暂无数据</div>
                    </td>
                  </tr>
                ) : (
                  rolePagination.items.map((role) => (
                    <tr key={role.id} className="data-row">
                      <td>{role.name}</td>
                      <td>{role.description || '-'}</td>
                      <td>{role.permissions ? role.permissions.length : 0}</td>
                      <td>{formatDateTime(role.createdAt)}</td>
                      <td className="col-actions">
                        {perm.can('role:edit') && (
                          <button
                            className="btn-link btn-link-primary"
                            onClick={() => handleOpenEditRole(role)}
                          >
                            编辑
                          </button>
                        )}
                        {perm.can('role:delete') && (
                          <button
                            className={`btn-link btn-link-danger ${roles.length <= 1 ? 'disabled' : ''}`}
                            disabled={roles.length <= 1}
                            onClick={() => roles.length > 1 && setRoleDeleteConfirm(role)}
                          >
                            删除
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {renderPagination(rolePagination, setRolePage)}
        </div>
      )}

      {userModalOpen && editingUser && (
        <div className="modal-overlay" onClick={() => { setUserModalOpen(false); setEditingUser(null); setCreatingUser(false) }}>
          <div
            className="modal-content panel-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <UserEditPanel
              key={editingUser.id}
              user={editingUser}
              allUsers={users}
              roles={roles}
              onSave={handleUserSave}
              onCancel={() => { setUserModalOpen(false); setEditingUser(null); setCreatingUser(false) }}
            />
          </div>
        </div>
      )}

      {userModalOpen && creatingUser && (
        <CreateUserModal
          key="create-user"
          roles={roles}
          onSave={handleUserSave}
          onCancel={() => { setUserModalOpen(false); setCreatingUser(false) }}
        />
      )}

      <RoleEditModal
        key={roleModalOpen ? (editingRole ? editingRole.id : 'new-role') : 'role-closed'}
        role={editingRole}
        allRoles={roles}
        open={roleModalOpen}
        onSave={handleRoleSave}
        onClose={() => { setRoleModalOpen(false); setEditingRole(null) }}
      />

      {userDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setUserDeleteConfirm(null)}>
          <div
            className="modal-content modal-small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">确认删除</h2>
              <button className="modal-close" onClick={() => setUserDeleteConfirm(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="confirm-message">
                确定要删除用户「{userDeleteConfirm.username}」吗？此操作不可恢复。
              </p>
              <div className="form-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setUserDeleteConfirm(null)}
                >
                  取消
                </button>
                <button className="btn btn-danger" onClick={handleUserDelete}>
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {roleDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setRoleDeleteConfirm(null)}>
          <div
            className="modal-content modal-small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">确认删除</h2>
              <button className="modal-close" onClick={() => setRoleDeleteConfirm(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="confirm-message">
                确定要删除角色「{roleDeleteConfirm.name}」吗？删除后该角色会从所有关联用户中移除，此操作不可恢复。
              </p>
              <div className="form-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setRoleDeleteConfirm(null)}
                >
                  取消
                </button>
                <button className="btn btn-danger" onClick={handleRoleDelete}>
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateUserModal({ roles, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    roleIds: [],
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const toggleRole = (roleId) => {
    setFormData((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = onSave(null, formData)
    if (result && !result.success) {
      setErrors(result.errors || {})
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">新增用户</h2>
          <button className="modal-close" onClick={onCancel}>
            ×
          </button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label">
              用户名 <span className="required">*</span>
            </label>
            <input
              className={`form-input ${errors.username ? 'has-error' : ''}`}
              type="text"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="请输入用户名（3-20位字母、数字、下划线）"
            />
            {errors.username && (
              <span className="form-error">{errors.username}</span>
            )}
          </div>

          <div className="form-row">
            <label className="form-label">
              邮箱 <span className="required">*</span>
            </label>
            <input
              className={`form-input ${errors.email ? 'has-error' : ''}`}
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="请输入邮箱"
            />
            {errors.email && (
              <span className="form-error">{errors.email}</span>
            )}
          </div>

          <div className="form-row">
            <label className="form-label">分配角色</label>
            <div className="role-checkboxes">
              {roles.length === 0 ? (
                <span className="empty-hint">暂无角色，请先创建角色</span>
              ) : (
                roles.map((role) => (
                  <label key={role.id} className="role-checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.roleIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                    />
                    <span className="role-checkbox-name">{role.name}</span>
                    {role.description && (
                      <span className="role-checkbox-desc">
                        - {role.description}
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
