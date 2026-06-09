export default function ConfirmDialog({ visible, title, message, onConfirm, onCancel, confirmText = '确认', cancelText = '取消' }) {
  if (!visible) return null

  return (
    <div className="ec-confirm-overlay" onClick={onCancel}>
      <div className="ec-confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="ec-confirm-title">{title}</h3>
        <p className="ec-confirm-message">{message}</p>
        <div className="ec-confirm-actions">
          <button type="button" className="ec-cancel-btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className="ec-send-btn" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
