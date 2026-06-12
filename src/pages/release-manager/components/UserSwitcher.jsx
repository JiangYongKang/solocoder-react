import { AVAILABLE_USERS } from '../constants.js'

export default function UserSwitcher({ currentUser, onUserChange }) {
  return (
    <div className="rm-user-switcher">
      <span className="rm-user-switcher-label">当前身份：</span>
      <select
        className="rm-user-switcher-select"
        value={currentUser.id}
        onChange={(e) => onUserChange(e.target.value)}
      >
        {AVAILABLE_USERS.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}（{u.role}）
          </option>
        ))}
      </select>
    </div>
  )
}
