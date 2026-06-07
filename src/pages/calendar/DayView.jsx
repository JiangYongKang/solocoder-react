import { useRef, useState } from 'react'
import { HOURS, SLOT_MINUTES } from './constants.js'
import {
  formatTime,
  filterEventsByDay,
  isSameDay,
  startOfDay,
  endOfDay,
  pixelsToMinutes,
  getDayViewEventPosition,
} from './calendarUtils.js'

const HOUR_HEIGHT = 60

export default function DayView({
  date,
  events,
  matchedIds,
  onEventClick,
  onSlotClick,
  onEventDrop,
}) {
  const dayEvents = filterEventsByDay(events, date)
  const [draggingId, setDraggingId] = useState(null)
  const [resizingId, setResizingId] = useState(null)
  const dragStateRef = useRef(null)
  const scrollRef = useRef(null)

  const handleSlotClick = (hour, e) => {
    if (e.target !== e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetY = e.clientY - rect.top
    const minutes = Math.floor(offsetY / (HOUR_HEIGHT / 2)) * SLOT_MINUTES
    const start = new Date(date)
    start.setHours(hour, minutes, 0, 0)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    onSlotClick && onSlotClick(start, end)
  }

  const handleEventMouseDown = (e, event, mode) => {
    e.stopPropagation()
    e.preventDefault()
    const startY = e.clientY

    if (mode === 'move') {
      setDraggingId(event.id)
      dragStateRef.current = {
        mode: 'move',
        id: event.id,
        startY,
        originalStart: event.startTime,
        originalEnd: event.endTime,
      }
    } else if (mode === 'resize') {
      setResizingId(event.id)
      dragStateRef.current = {
        mode: 'resize',
        id: event.id,
        startY,
        originalStart: event.startTime,
        originalEnd: event.endTime,
      }
    }

    const handleMove = (me) => {
      const state = dragStateRef.current
      if (!state) return

      const deltaPx = me.clientY - state.startY
      const deltaMin = Math.round(pixelsToMinutes(deltaPx, HOUR_HEIGHT) / 15) * 15

      if (state.mode === 'move') {
        const origStart = new Date(state.originalStart)
        const origEnd = new Date(state.originalEnd)
        const duration = origEnd.getTime() - origStart.getTime()
        const newStart = new Date(origStart.getTime() + deltaMin * 60 * 1000)
        const newEnd = new Date(newStart.getTime() + duration)
        const dayStart = startOfDay(date).getTime()
        const dayEnd = endOfDay(date).getTime()
        if (newStart.getTime() >= dayStart && newEnd.getTime() <= dayEnd) {
          onEventDrop && onEventDrop(state.id, newStart.toISOString(), newEnd.toISOString())
        }
      } else if (state.mode === 'resize') {
        const origStart = new Date(state.originalStart)
        const origEnd = new Date(state.originalEnd)
        const newEnd = new Date(origEnd.getTime() + deltaMin * 60 * 1000)
        if (
          isSameDay(newEnd, date) &&
          newEnd.getTime() > origStart.getTime() + 15 * 60 * 1000
        ) {
          onEventDrop &&
            onEventDrop(state.id, state.originalStart, newEnd.toISOString())
        }
      }
    }

    const handleUp = () => {
      dragStateRef.current = null
      setDraggingId(null)
      setResizingId(null)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  return (
    <div className="cal-day-view">
      <div className="cal-time-column">
        {HOURS.map((h) => (
          <div key={h} className="cal-time-label" style={{ height: HOUR_HEIGHT }}>
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>
      <div className="cal-day-column" ref={scrollRef}>
        {HOURS.map((h) => (
          <div
            key={h}
            className="cal-time-slot"
            style={{ height: HOUR_HEIGHT }}
            onClick={(e) => handleSlotClick(h, e)}
          >
            <div className="cal-half-slot" style={{ height: HOUR_HEIGHT / 2 }} />
            <div className="cal-half-slot" style={{ height: HOUR_HEIGHT / 2 }} />
          </div>
        ))}
        <div className="cal-events-layer">
          {dayEvents.map((event) => {
            const pos = getDayViewEventPosition(event, date, HOUR_HEIGHT)
            const isMatched = matchedIds.has(event.id)
            return (
              <div
                key={event.id}
                className={`cal-event ${isMatched ? 'cal-event-highlighted' : ''} ${
                  draggingId === event.id || resizingId === event.id ? 'cal-event-dragging' : ''
                }`}
                style={{
                  top: pos.top,
                  height: pos.height,
                  backgroundColor: event.color,
                  borderLeftColor: event.color,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onEventClick && onEventClick(event)
                }}
                onMouseDown={(e) => handleEventMouseDown(e, event, 'move')}
              >
                <div className="cal-event-title">{event.title}</div>
                <div className="cal-event-time">
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </div>
                <div
                  className="cal-event-resize-handle"
                  onMouseDown={(e) => handleEventMouseDown(e, event, 'resize')}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
