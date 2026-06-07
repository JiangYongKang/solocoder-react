import { useRef, useState } from 'react'
import { HOURS, WEEKDAY_LABELS, SLOT_MINUTES } from './constants.js'
import {
  formatTime,
  getWeekDates,
  filterEventsByWeek,
  isSameDay,
  startOfWeek,
  endOfWeek,
  pixelsToMinutes,
  getWeekViewEventPosition,
} from './calendarUtils.js'

const HOUR_HEIGHT = 60

export default function WeekView({
  date,
  events,
  matchedIds,
  onEventClick,
  onSlotClick,
  onEventDrop,
}) {
  const weekDates = getWeekDates(date)
  const weekEvents = filterEventsByWeek(events, date)
  const [draggingId, setDraggingId] = useState(null)
  const [resizingId, setResizingId] = useState(null)
  const dragStateRef = useRef(null)
  const columnsContainerRef = useRef(null)
  const scrollRef = useRef(null)

  const handleSlotClick = (dayDate, hour, e) => {
    if (e.target !== e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetY = e.clientY - rect.top
    const minutes = Math.floor(offsetY / (HOUR_HEIGHT / 2)) * SLOT_MINUTES
    const start = new Date(dayDate)
    start.setHours(hour, minutes, 0, 0)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    onSlotClick && onSlotClick(start, end)
  }

  const getColumnWidth = () => {
    if (!columnsContainerRef.current) return 180
    const firstCol = columnsContainerRef.current.querySelector('.cal-week-day-column')
    if (!firstCol) return 180
    return firstCol.getBoundingClientRect().width
  }

  const handleEventMouseDown = (e, event, mode) => {
    e.stopPropagation()
    e.preventDefault()
    const startY = e.clientY
    const startX = e.clientX
    const columnWidth = getColumnWidth()

    if (mode === 'move') {
      setDraggingId(event.id)
      dragStateRef.current = {
        mode: 'move',
        id: event.id,
        startY,
        startX,
        columnWidth,
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
        const deltaXPx = me.clientX - state.startX
        const deltaDay = state.columnWidth > 0 ? Math.round(deltaXPx / state.columnWidth) : 0
        const origStart = new Date(state.originalStart)
        const origEnd = new Date(state.originalEnd)
        const duration = origEnd.getTime() - origStart.getTime()
        let newStart = new Date(origStart.getTime() + deltaMin * 60 * 1000)
        newStart = new Date(newStart.getTime() + deltaDay * 24 * 60 * 60 * 1000)
        const newEnd = new Date(newStart.getTime() + duration)
        const weekStart = startOfWeek(date).getTime()
        const weekEnd = endOfWeek(date).getTime()
        if (newStart.getTime() >= weekStart && newEnd.getTime() <= weekEnd) {
          onEventDrop && onEventDrop(state.id, newStart.toISOString(), newEnd.toISOString())
        }
      } else if (state.mode === 'resize') {
        const origStart = new Date(state.originalStart)
        const origEnd = new Date(state.originalEnd)
        const newEnd = new Date(origEnd.getTime() + deltaMin * 60 * 1000)
        if (newEnd.getTime() > origStart.getTime() + 15 * 60 * 1000) {
          onEventDrop && onEventDrop(state.id, state.originalStart, newEnd.toISOString())
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
    <div className="cal-week-view">
      <div className="cal-week-header">
        <div className="cal-time-column cal-time-header-spacer" />
        {weekDates.map((d, i) => (
          <div key={i} className="cal-week-day-header">
            <div className="cal-weekday-label">{WEEKDAY_LABELS[d.getDay()]}</div>
            <div className={`cal-weekday-date ${isToday(d) ? 'cal-weekday-today' : ''}`}>
              {d.getDate()}
            </div>
          </div>
        ))}
      </div>
      <div className="cal-week-body" ref={scrollRef}>
        <div className="cal-time-column">
          {HOURS.map((h) => (
            <div key={h} className="cal-time-label" style={{ height: HOUR_HEIGHT }}>
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        <div className="cal-week-columns" ref={columnsContainerRef}>
          {weekDates.map((dayDate, dayIdx) => {
            const dayEvents = weekEvents.filter((e) => {
              const eStart = new Date(e.startTime).getTime()
              const eEnd = new Date(e.endTime).getTime()
              const dStart = new Date(dayDate).setHours(0, 0, 0, 0)
              const dEnd = new Date(dayDate).setHours(23, 59, 59, 999)
              return eStart < dEnd && eEnd > dStart
            })
            return (
              <div key={dayIdx} className="cal-week-day-column">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="cal-time-slot"
                    style={{ height: HOUR_HEIGHT }}
                    onClick={(e) => handleSlotClick(dayDate, h, e)}
                  >
                    <div className="cal-half-slot" style={{ height: HOUR_HEIGHT / 2 }} />
                    <div className="cal-half-slot" style={{ height: HOUR_HEIGHT / 2 }} />
                  </div>
                ))}
                <div className="cal-events-layer">
                  {dayEvents.map((event) => {
                    const pos = getWeekViewEventPosition(event, dayDate, HOUR_HEIGHT)
                    const isMatched = matchedIds.has(event.id)
                    return (
                      <div
                        key={event.id}
                        className={`cal-event cal-event-compact ${
                          isMatched ? 'cal-event-highlighted' : ''
                        } ${draggingId === event.id || resizingId === event.id ? 'cal-event-dragging' : ''}`}
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
            )
          })}
        </div>
      </div>
    </div>
  )
}
