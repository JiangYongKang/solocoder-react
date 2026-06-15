import { getSpaceMembers } from './wikiUtils.js'
import { ROLE_TYPES } from './constants.js'

export default function MemberPanel({
  isOpen,
  onClose,
  data,
  spaceId,
}) {
  if (!isOpen) return null

  const members = getSpaceMembers(data, spaceId)

  const getRoleClass = (role) => {
    switch (role) {
      case ROLE_TYPES.ADMIN:
        return 'wiki-role-admin'
      case ROLE_TYPES.EDITOR:
        return 'wiki-role-editor'
      case ROLE_TYPES.VIEWER:
        return 'wiki-role-viewer'
      default:
        return ''
    }
  }

  return (
    <div className="wiki-modal-overlay" onClick={onClose}>
      <div className="wiki-modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="wiki-modal-header">空间成员</div>
        <div className="wiki-modal-body">
          <table className="wiki-member-table">
            <thead>
              <tr>
                <th>成员</th>
                <th>角色</th>
                <th>加入时间</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="wiki-member-info">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="wiki-member-avatar"
                      />
                      <span>{member.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`wiki-role-badge ${getRoleClass(member.role)}`}>
                      {member.roleLabel}
                    </span>
                  </td>
                  <td>{member.joinedAtLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="wiki-modal-footer">
          <button className="wiki-btn wiki-btn-secondary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
