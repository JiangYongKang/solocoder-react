import { useRef, useState } from 'react'
import { HOURS, SLOT_MINUTES } from './constants.js'
import {
  formatTime,
  filterEventsByDay,
  getMinutesFromStart,
  getEventDurationMinutes,
  isSameDay,
  formatDate,
} from './calendarUtils.js'

const PIXELS_PER_MINUTE = 1.2
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
  const [dragging, setDragging] = useState(null)
  const [resizing, setResizing] = useState(null)
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
      setDragging({ id: event.id, startY, originalStart: event.startTime, originalEnd: event.endTime })
    } else if (mode === 'resize') {
      setResizing({ id: event.id, startY, originalEnd: event.endTime })
    }

    const handleMove = (me) => {
      const deltaMin = Math.round((me.clientY - startY) / PIXELS_PER_MINUTE / 15) * 15
      if (mode === 'move' && draggingRef()) {
        const d = draggingRef()
        const origStart = new Date(d.originalStart)
        const origEnd = new Date(d.originalEnd)
        const duration = origEnd.getTime() - origStart.getTime()
        const newStart = new Date(origStart.getTime() + deltaMin * 60 * 1000)
        const newEnd = new Date(newStart.getTime() + duration)
        if (isSameDay(newStart, date)) {
          onEventDrop && onEventDrop(d.id, newStart.toISOString(), newEnd.toISOString())
        }
      } else if (mode === 'resize' && resizingRef()) {
        const r = resizingRef()
        const origEnd = new Date(r.originalEnd)
        const newEnd = new Date(origEnd.getTime() + deltaMin * 60 * 1000)
        if (isSameDay(newEnd, date) && newEnd.getTime() > new Date(events.find((ev) => ev.id === r.id)?.startTime).getTime()) {
          onEventDrop &&
            onEventDrop(
              r.id,
              events.find((ev) => ev.id === r.id)?.startTime,
              newEnd.toISOString()
            )
        }
      }
    }

    const handleUp = () => {
      setDragging(null)
      setResizing(null)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  const draggingRef = () => dragging
  const resizingRef = () => resizing

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
            const startMin = getMinutesFromStart(event.startTime)
            const duration = getEventDurationMinutes(event)
            const top = startMin * (HOUR_HEIGHT / 60)
            const height = Math.max(24, duration * (HOUR_HEIGHT / 60) - 2)
            const isMatched = matchedIds.has(event.id)
            return (
              <div
                key={event.id}
                className={`cal-event ${isMatched ? 'cal-event-highlighted' : ''} ${
                  dragging?.id === event.id ? 'cal-event-dragging' : ''
                }`}
                style={{
                  top,
                  height,
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
