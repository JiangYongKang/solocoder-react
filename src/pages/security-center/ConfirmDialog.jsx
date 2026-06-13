export default function ConfirmDialog({ open, title, message, confirmText = '确认', cancelText = '取消', danger = false, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="modal-title confirm-title">{title}</h3>}
        {message && <p className="confirm-message">{message}</p>}
        <div className="modal-footer confirm-footer">
          <button className="btn btn-secondary" onClick={onCancel}>{cancelText}</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
