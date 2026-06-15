import { PRESET_ICONS, MENU_TYPES, TARGET_TYPES } from './constants.js'
import { getIconEmoji } from './menuDesignerCore.js'

export default function PropertyPanel({ item, onUpdate }) {
  if (!item) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#999',
          fontSize: '13px',
        }}
      >
        请选择一个菜单项进行编辑
      </div>
    )
  }

  const isDivider = item.type === MENU_TYPES.DIVIDER

  const handleChange = (key, value) => {
    onUpdate(item.id, { [key]: value })
  }

  return (
    <div style={{ padding: '16px', overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#333',
            margin: 0,
            marginBottom: '4px',
          }}
        >
          菜单属性
        </h3>
        <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>
          ID: {item.id}
        </p>
      </div>

      {isDivider ? (
        <div
          style={{
            padding: '20px',
            background: '#f5f5f5',
            borderRadius: '6px',
            textAlign: 'center',
            color: '#666',
            fontSize: '13px',
          }}
        >
          分割线菜单项
          <div
            style={{
              height: '1px',
              background: '#ddd',
              margin: '16px 0',
            }}
          />
          <div style={{ fontSize: '12px', color: '#999' }}>
            分割线仅用于视觉分隔，无可编辑属性
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="菜单类型">
            <select
              value={item.type}
              onChange={(e) => handleChange('type', e.target.value)}
              style={selectStyle}
            >
              <option value={MENU_TYPES.LINK}>链接</option>
              <option value={MENU_TYPES.GROUP}>菜单组</option>
              <option value={MENU_TYPES.DIVIDER}>分割线</option>
            </select>
          </Field>

          <Field label="菜单名称">
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="请输入菜单名称"
              style={inputStyle}
            />
          </Field>

          <Field label="图标">
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '8px',
                border: '1px solid #e8e8e8',
                borderRadius: '4px',
                maxHeight: '150px',
                overflow: 'auto',
                background: '#fafafa',
              }}
            >
              <div
                onClick={() => handleChange('icon', '')}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  border: !item.icon ? '2px solid #1677ff' : '2px solid transparent',
                  background: !item.icon ? '#e6f4ff' : 'white',
                  fontSize: '14px',
                  color: '#999',
                }}
                title="无图标"
              >
                ∅
              </div>
              {PRESET_ICONS.map((icon) => (
                <div
                  key={icon.id}
                  onClick={() => handleChange('icon', icon.id)}
                  title={`${icon.emoji} ${icon.label}`}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    border: item.icon === icon.id ? '2px solid #1677ff' : '2px solid transparent',
                    background: item.icon === icon.id ? '#e6f4ff' : 'white',
                    fontSize: '18px',
                    transition: 'all 0.15s',
                  }}
                >
                  {icon.emoji}
                </div>
              ))}
            </div>
            {item.icon && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                已选: {getIconEmoji(item.icon)} {item.icon}
              </div>
            )}
          </Field>

          {item.type === MENU_TYPES.LINK && (
            <Field label="链接地址">
              <input
                type="text"
                value={item.link}
                onChange={(e) => handleChange('link', e.target.value)}
                placeholder="#/path 或完整 URL"
                style={inputStyle}
              />
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                支持 # 开头的锚点链接或完整 URL
              </div>
            </Field>
          )}

          {item.type === MENU_TYPES.LINK && (
            <Field label="打开方式">
              <select
                value={item.target}
                onChange={(e) => handleChange('target', e.target.value)}
                style={selectStyle}
              >
                <option value={TARGET_TYPES.SELF}>当前页</option>
                <option value={TARGET_TYPES.BLANK}>新标签</option>
              </select>
            </Field>
          )}

          <Field label="权限要求">
            <input
              type="text"
              value={item.permission}
              onChange={(e) => handleChange('permission', e.target.value)}
              placeholder="如: admin, user（留空表示无限制"
              style={inputStyle}
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              多个权限用逗号分隔
            </div>
          </Field>
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #d9d9d9',
  borderRadius: '4px',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #d9d9d9',
  borderRadius: '4px',
  fontSize: '13px',
  outline: 'none',
  background: 'white',
  boxSizing: 'border-box',
}

function Field({ label, children }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '13px',
          color: '#666',
          marginBottom: '6px',
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
