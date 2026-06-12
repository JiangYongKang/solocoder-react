import { useState } from 'react'
import TreeNode from './TreeNode.jsx'
import { getNode } from './noteUtils.js'

export default function TreeView({
  data,
  selectedNoteId,
  onSelectNote,
  onToggleNode,
  onContextMenu,
  onRenameNode,
  onMoveNode,
}) {
  const [editingId, setEditingId] = useState(null)

  function handleDrop(draggedId, targetId) {
    onMoveNode(draggedId, targetId)
  }

  return (
    <div className="tree-view">
      {data.rootNotebooks.map((notebookId) => {
        const notebook = getNode(data, notebookId)
        if (!notebook) return null
        return (
          <TreeNode
            key={notebookId}
            node={notebook}
            data={data}
            selectedNoteId={selectedNoteId}
            onSelect={onSelectNote}
            onToggle={onToggleNode}
            onContextMenu={onContextMenu}
            onRename={onRenameNode}
            onDrop={handleDrop}
            editingId={editingId}
            setEditingId={setEditingId}
          />
        )
      })}
    </div>
  )
}
