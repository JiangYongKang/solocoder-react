import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { generateId, getAvatarColor } from './constants'
import { validateParticipant } from './utils'

function SortableParticipantItem({ participant, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: participant.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`participant-item ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div
        className="participant-avatar"
        style={{ background: participant.color }}
      >
        {participant.name.charAt(0)}
      </div>
      <span className="participant-name">{participant.name}</span>
      <button
        type="button"
        className="participant-delete"
        title="删除"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(participant.id)
        }}
      >
        ×
      </button>
    </div>
  )
}

export default function ParticipantPanel({ participants, setParticipants }) {
  const [nameInput, setNameInput] = useState('')
  const [error, setError] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAdd = () => {
    const err = validateParticipant(nameInput, participants)
    if (err) {
      setError(err)
      return
    }
    const trimmed = nameInput.trim()
    const newParticipant = {
      id: generateId('p'),
      name: trimmed,
      color: getAvatarColor(trimmed, participants.length),
    }
    setParticipants([...participants, newParticipant])
    setNameInput('')
    setError('')
  }

  const handleDelete = (id) => {
    setParticipants(participants.filter((p) => p.id !== id))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setParticipants((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  return (
    <section className="bill-splitter-section">
      <h2 className="section-title">
        <span>参与者</span>
        <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text)' }}>
          {participants.length} 人
        </span>
      </h2>

      <div className="participant-input-row">
        <input
          type="text"
          className={`form-input ${error ? 'error' : ''}`}
          placeholder="输入名称"
          value={nameInput}
          onChange={(e) => {
            setNameInput(e.target.value)
            setError('')
          }}
          onKeyDown={handleKeyDown}
          maxLength={20}
        />
        <button type="button" className="btn btn-primary" onClick={handleAdd}>
          添加
        </button>
      </div>
      {error && <div className="error-text">{error}</div>}

      {participants.length < 2 && (
        <div className="empty-hint" style={{ marginTop: 8 }}>
          至少添加 2 个参与者才能添加费用
        </div>
      )}

      {participants.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={participants.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="participant-list">
              {participants.map((p) => (
                <SortableParticipantItem
                  key={p.id}
                  participant={p}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  )
}
