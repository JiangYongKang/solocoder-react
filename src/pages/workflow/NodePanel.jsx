import { NODE_TYPES, NODE_TYPE_LABELS, NODE_TYPE_ICONS } from './workflowCore'

function NodePanel() {
  const nodeTypes = [
    NODE_TYPES.START,
    NODE_TYPES.END,
    NODE_TYPES.TASK,
    NODE_TYPES.CONDITION,
    NODE_TYPES.PARALLEL,
  ]

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('application/workflow-node-type', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside className="wf-panel">
      <h2 className="wf-panel-title">节点类型</h2>
      <div className="wf-node-list">
        {nodeTypes.map((type) => (
          <div
            key={type}
            className="wf-node-item"
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
          >
            <span className="wf-node-icon">{NODE_TYPE_ICONS[type]}</span>
            <span className="wf-node-label">{NODE_TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}

export default NodePanel
