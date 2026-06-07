import { NODE_TYPES, NODE_TYPE_LABELS, NODE_TYPE_ICONS } from './workflowCore'

function PropertyPanel({ selectedNode, onUpdateNode, onDeleteNode }) {
  if (!selectedNode) {
    return (
      <aside className="wf-panel">
        <h2 className="wf-panel-title">属性编辑</h2>
        <div className="wf-empty-panel">
          点击画布中的节点<br />编辑其属性
        </div>
      </aside>
    )
  }

  const handleChange = (key, value) => {
    onUpdateNode(selectedNode.id, { [key]: value })
  }

  const handleDelete = () => {
    onDeleteNode(selectedNode.id)
  }

  return (
    <aside className="wf-panel">
      <h2 className="wf-panel-title">属性编辑</h2>
      <div className="wf-prop-type">
        <span style={{ marginRight: 6 }}>{NODE_TYPE_ICONS[selectedNode.type]}</span>
        {NODE_TYPE_LABELS[selectedNode.type]}
      </div>

      <div className="wf-prop-group">
        <label className="wf-prop-label" htmlFor={`wf-label-${selectedNode.id}`}>
          名称
        </label>
        <input
          id={`wf-label-${selectedNode.id}`}
          type="text"
          className="wf-input"
          value={selectedNode.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
        />
      </div>

      {selectedNode.type === NODE_TYPES.TASK && (
        <div className="wf-prop-group">
          <label className="wf-prop-label" htmlFor={`wf-assignee-${selectedNode.id}`}>
            处理人
          </label>
          <input
            id={`wf-assignee-${selectedNode.id}`}
            type="text"
            className="wf-input"
            placeholder="请输入处理人"
            value={selectedNode.assignee || ''}
            onChange={(e) => handleChange('assignee', e.target.value)}
          />
        </div>
      )}

      {selectedNode.type === NODE_TYPES.CONDITION && (
        <div className="wf-prop-group">
          <label className="wf-prop-label" htmlFor={`wf-expression-${selectedNode.id}`}>
            判断表达式
          </label>
          <textarea
            id={`wf-expression-${selectedNode.id}`}
            className="wf-textarea"
            placeholder="例如: amount > 1000"
            value={selectedNode.expression || ''}
            onChange={(e) => handleChange('expression', e.target.value)}
          />
        </div>
      )}

      {selectedNode.type !== NODE_TYPES.START && selectedNode.type !== NODE_TYPES.END && (
        <button
          type="button"
          className="wf-btn wf-btn-danger"
          style={{ width: '100%', marginTop: 16 }}
          onClick={handleDelete}
        >
          🗑 删除节点
        </button>
      )}
    </aside>
  )
}

export default PropertyPanel
