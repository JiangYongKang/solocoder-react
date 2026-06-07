import { FIELD_TYPES, FIELD_TYPE_LABELS } from './formBuilderCore'

const FIELD_TYPE_LIST = [
  FIELD_TYPES.TEXT,
  FIELD_TYPES.TEXTAREA,
  FIELD_TYPES.SELECT,
  FIELD_TYPES.RADIO,
  FIELD_TYPES.CHECKBOX,
  FIELD_TYPES.DATE,
  FIELD_TYPES.NUMBER,
  FIELD_TYPES.SWITCH,
]

function FieldPanel() {
  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('application/x-form-field-type', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="fb-panel fb-field-panel">
      <h3 className="fb-panel-title">字段类型</h3>
      <div className="fb-field-list">
        {FIELD_TYPE_LIST.map((type) => (
          <div
            key={type}
            className="fb-field-item"
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
          >
            <span className="fb-field-icon">
              {getFieldIcon(type)}
            </span>
            <span className="fb-field-label">
              {FIELD_TYPE_LABELS[type]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getFieldIcon(type) {
  switch (type) {
    case FIELD_TYPES.TEXT:
      return '📝'
    case FIELD_TYPES.TEXTAREA:
      return '📄'
    case FIELD_TYPES.SELECT:
      return '🔽'
    case FIELD_TYPES.RADIO:
      return '🔘'
    case FIELD_TYPES.CHECKBOX:
      return '☑️'
    case FIELD_TYPES.DATE:
      return '📅'
    case FIELD_TYPES.NUMBER:
      return '🔢'
    case FIELD_TYPES.SWITCH:
      return '🔛'
    default:
      return '📋'
  }
}

export default FieldPanel
