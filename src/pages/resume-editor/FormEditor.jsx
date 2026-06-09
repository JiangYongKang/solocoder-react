import { MODULE_TYPES, BASIC_INFO_FIELDS, JOB_INTENTION_FIELDS, LIST_ITEM_FIELDS } from './constants'
import { validateBasicInfo, getModuleLabel } from './resumeCore'

function BasicInfoEditor({ moduleData, onChange }) {
  const errors = validateBasicInfo(moduleData)

  const handleChange = (key, value) => {
    onChange({ ...moduleData, [key]: value })
  }

  return (
    <div>
      {BASIC_INFO_FIELDS.map((field) => (
        <div key={field.key} className="re-form-group">
          <label
            className={`re-form-label ${errors[field.key] ? 're-form-label-error' : ''}`}
          >
            {field.label}
          </label>
          <input
            type={field.type}
            className={`re-input ${errors[field.key] ? 're-input-error' : ''}`}
            placeholder={field.placeholder}
            value={moduleData?.[field.key] || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
          />
          {errors[field.key] && (
            <div className="re-form-error">{errors[field.key]}</div>
          )}
        </div>
      ))}
    </div>
  )
}

function SimpleEditor({ fields, moduleData, onChange }) {
  const handleChange = (key, value) => {
    onChange({ ...moduleData, [key]: value })
  }

  return (
    <div>
      {fields.map((field) => (
        <div key={field.key} className="re-form-group">
          <label className="re-form-label">{field.label}</label>
          <input
            type={field.type}
            className="re-input"
            placeholder={field.placeholder}
            value={moduleData?.[field.key] || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
          />
        </div>
      ))}
    </div>
  )
}

function TextAreaEditor({ moduleData, onChange, placeholder = '请输入内容...' }) {
  return (
    <div className="re-form-group">
      <label className="re-form-label">内容</label>
      <textarea
        className="re-textarea"
        placeholder={placeholder}
        value={moduleData?.content || ''}
        onChange={(e) => onChange({ ...moduleData, content: e.target.value })}
      />
    </div>
  )
}

function ListEditor({ moduleType, moduleData, onAddItem, onDeleteItem, onUpdateItem }) {
  const fields = LIST_ITEM_FIELDS[moduleType] || []
  const items = Array.isArray(moduleData?.items) ? moduleData.items : []

  return (
    <div>
      {items.length === 0 && (
        <div className="re-empty-hint">暂无记录，点击下方按钮添加</div>
      )}
      {items.map((item, idx) => (
        <div key={item.id} className="re-list-item">
          <div className="re-list-item-header">
            <span className="re-list-item-title">记录 {idx + 1}</span>
            <button
              type="button"
              className="re-btn re-btn-small re-btn-danger"
              onClick={() => onDeleteItem(item.id)}
            >
              删除
            </button>
          </div>
          {fields.map((field) => (
            <div key={field.key} className="re-form-group">
              <label className="re-form-label">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  className="re-textarea"
                  placeholder={field.placeholder}
                  value={item[field.key] || ''}
                  onChange={(e) => onUpdateItem(item.id, { [field.key]: e.target.value })}
                />
              ) : (
                <input
                  type={field.type}
                  className="re-input"
                  placeholder={field.placeholder}
                  value={item[field.key] || ''}
                  onChange={(e) => onUpdateItem(item.id, { [field.key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
      ))}
      <button
        type="button"
        className="re-btn re-btn-small"
        onClick={onAddItem}
        style={{ width: '100%', marginTop: 4 }}
      >
        + 添加一条
      </button>
    </div>
  )
}

function FormEditor({
  selectedModule,
  onModuleDataChange,
  onModuleTitleChange,
  onAddListItem,
  onDeleteListItem,
  onUpdateListItem,
}) {
  if (!selectedModule) {
    return (
      <div className="re-empty-hint" style={{ marginTop: 20 }}>
        请从左侧选择一个模块进行编辑
      </div>
    )
  }

  const showTitleEdit =
    selectedModule.type === MODULE_TYPES.CUSTOM ||
    selectedModule.type === MODULE_TYPES.SKILLS ||
    selectedModule.type === MODULE_TYPES.SELF_EVALUATION ||
    selectedModule.type === MODULE_TYPES.EDUCATION ||
    selectedModule.type === MODULE_TYPES.WORK_EXPERIENCE ||
    selectedModule.type === MODULE_TYPES.PROJECT_EXPERIENCE ||
    selectedModule.type === MODULE_TYPES.JOB_INTENTION

  const handleDataChange = (newData) => {
    onModuleDataChange(selectedModule.id, newData)
  }

  return (
    <div>
      <div className="re-editor-title">
        {showTitleEdit ? (
          <input
            type="text"
            className="re-editor-title-input"
            value={selectedModule.title || getModuleLabel(selectedModule)}
            onChange={(e) => onModuleTitleChange(selectedModule.id, e.target.value)}
          />
        ) : (
          <span>{getModuleLabel(selectedModule)}</span>
        )}
      </div>

      {selectedModule.type === MODULE_TYPES.BASIC_INFO && (
        <BasicInfoEditor moduleData={selectedModule.data} onChange={handleDataChange} />
      )}

      {selectedModule.type === MODULE_TYPES.JOB_INTENTION && (
        <SimpleEditor
          fields={JOB_INTENTION_FIELDS}
          moduleData={selectedModule.data}
          onChange={handleDataChange}
        />
      )}

      {selectedModule.type === MODULE_TYPES.EDUCATION && (
        <ListEditor
          moduleType={selectedModule.type}
          moduleData={selectedModule.data}
          onAddItem={() => onAddListItem(selectedModule.id)}
          onDeleteItem={(itemId) => onDeleteListItem(selectedModule.id, itemId)}
          onUpdateItem={(itemId, updates) => onUpdateListItem(selectedModule.id, itemId, updates)}
        />
      )}

      {selectedModule.type === MODULE_TYPES.WORK_EXPERIENCE && (
        <ListEditor
          moduleType={selectedModule.type}
          moduleData={selectedModule.data}
          onAddItem={() => onAddListItem(selectedModule.id)}
          onDeleteItem={(itemId) => onDeleteListItem(selectedModule.id, itemId)}
          onUpdateItem={(itemId, updates) => onUpdateListItem(selectedModule.id, itemId, updates)}
        />
      )}

      {selectedModule.type === MODULE_TYPES.PROJECT_EXPERIENCE && (
        <ListEditor
          moduleType={selectedModule.type}
          moduleData={selectedModule.data}
          onAddItem={() => onAddListItem(selectedModule.id)}
          onDeleteItem={(itemId) => onDeleteListItem(selectedModule.id, itemId)}
          onUpdateItem={(itemId, updates) => onUpdateListItem(selectedModule.id, itemId, updates)}
        />
      )}

      {(selectedModule.type === MODULE_TYPES.SKILLS ||
        selectedModule.type === MODULE_TYPES.SELF_EVALUATION ||
        selectedModule.type === MODULE_TYPES.CUSTOM) && (
        <TextAreaEditor
          moduleData={selectedModule.data}
          onChange={handleDataChange}
          placeholder={
            selectedModule.type === MODULE_TYPES.SKILLS
              ? '请输入技能列表，每行一个...'
              : selectedModule.type === MODULE_TYPES.SELF_EVALUATION
              ? '请输入自我评价...'
              : '请输入内容...'
          }
        />
      )}
    </div>
  )
}

export default FormEditor
