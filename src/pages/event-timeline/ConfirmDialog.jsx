export default function ConfirmDialog({
  isOpen,
  title = '确认操作',
  message = '确定要执行此操作吗？',
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="et-modal-overlay"
      onClick={onCancel}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="et-confirm-title"
    >
      <div className="et-modal et-modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="et-modal-header">
          <h2 id="et-confirm-title">{title}</h2>
        </div>
        <div className="et-modal-body">
          <p className="et-confirm-message">{message}</p>
          <div className="et-modal-actions et-confirm-actions">
            <button type="button" className="et-btn et-btn-ghost" onClick={onCancel}>
              {cancelText}
            </button>
            <button type="button" className="et-btn et-btn-danger" onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
