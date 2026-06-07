import { useEffect, useRef } from 'react'
import { getCheckState, togglePermission, isParentNode } from './utils'
import { PERMISSION_TREE } from './constants'

function TreeNode({ node, checkedIds, onToggle, tree, level = 0 }) {
  const state = getCheckState(node.id, checkedIds, tree)
  const isParent = isParentNode(node.id, tree)
  const checkboxRef = useRef(null)

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = state === 'indeterminate'
    }
  }, [state])

  return (
    <div className="tree-node" style={{ paddingLeft: level * 20 }}>
      <label className="tree-node-label">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={state === 'checked'}
          onChange={() => onToggle(node.id)}
        />
        <span className="tree-node-text">{node.label}</span>
        {isParent && (
          <span className="tree-node-badge">({node.children.length})</span>
        )}
      </label>
      {isParent && node.children && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              checkedIds={checkedIds}
              onToggle={onToggle}
              tree={tree}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PermissionTree({ checkedIds = [], onChange }) {
  const handleToggle = (nodeId) => {
    const next = togglePermission(checkedIds, nodeId, PERMISSION_TREE)
    onChange && onChange(next)
  }

  return (
    <div className="permission-tree">
      {PERMISSION_TREE.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          checkedIds={checkedIds}
          onToggle={handleToggle}
          tree={PERMISSION_TREE}
          level={0}
        />
      ))}
    </div>
  )
}
