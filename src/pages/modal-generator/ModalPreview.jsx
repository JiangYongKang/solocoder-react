import { useMemo } from 'react'
import {
  getAnimationClass,
  clampWidth,
  clampMaskOpacity,
  clampAnimationDuration,
  hasConfirmButton,
  hasCancelButton,
  hasFormFields,
} from './modalGeneratorCore'

function ModalPreview({ config, animationKey, onClose }) {
  const modalWidth = useMemo(() => clampWidth(config.width), [config.width])
  const maskOpacityValue = useMemo(() => clampMaskOpacity(config.maskOpacity) / 100, [config.maskOpacity])
  const animationClassName = useMemo(() => getAnimationClass(config.animation), [config.animation])
  const animDuration = useMemo(() => clampAnimationDuration(config.animationDuration), [config.animationDuration])

  const maskStyle = {
    backgroundColor: `rgba(0, 0, 0, ${maskOpacityValue})`,
  }

  const modalStyle = {
    width: `${modalWidth}px`,
    animationDuration: `${animDuration}ms`,
  }

  const confirmStyle = {
    backgroundColor: config.confirmColor,
    borderColor: config.confirmColor,
  }

  const cancelStyle = {
    color: config.cancelColor,
    borderColor: config.cancelColor,
  }

  const handleMaskClick = () => {
    if (config.closeOnMaskClick && onClose) {
      onClose()
    }
  }

  const handleCloseClick = () => {
    if (onClose) {
      onClose()
    }
  }

  const showConfirmBtn = hasConfirmButton(config.type)
  const showCancelBtn = hasCancelButton(config.type)
  const showForm = hasFormFields(config.type)

  return (
    <div className="mg-preview-overlay" style={maskStyle} onClick={handleMaskClick}>
      <div
        key={animationKey}
        className={`mg-modal ${animationClassName}`}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {config.showCloseButton && (
          <button type="button" className="mg-modal-close" onClick={handleCloseClick} aria-label="关闭">
            ×
          </button>
        )}

        {config.title && (
          <div className="mg-modal-header">
            <h3 className="mg-modal-title">{config.title}</h3>
          </div>
        )}

        <div className="mg-modal-body">
          {showForm ? (
            <div className="mg-modal-form">
              {config.formFields && config.formFields.map((field) => (
                <div key={field.id} className="mg-form-item">
                  <label className="mg-form-label">{field.label}</label>
                  <input
                    type="text"
                    className="mg-form-input"
                    placeholder={field.placeholder}
                    readOnly
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="mg-modal-content">{config.content}</p>
          )}
        </div>

        {(showConfirmBtn || showCancelBtn) && (
          <div className="mg-modal-footer">
            {showCancelBtn && (
              <button type="button" className="mg-btn mg-btn-cancel" style={cancelStyle}>
                {config.cancelText}
              </button>
            )}
            {showConfirmBtn && (
              <button type="button" className="mg-btn mg-btn-confirm" style={confirmStyle}>
                {config.confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ModalPreview
