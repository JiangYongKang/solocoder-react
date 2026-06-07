import { useRef, useState } from 'react'
import { HOURS, WEEKDAY_LABELS, SLOT_MINUTES } from './constants.js'
import {
  formatTime,
  getWeekDates,
  filterEventsByWeek,
  getMinutesFromStart,
  getEventDurationMinutes,
  isSameDay,
  formatDate,
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
  const [dragging, setDragging] = useState(null)
  const [resizing, setResizing] = useState(null)
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

  const handleEventMouseDown = (e, event, mode) => {
    e.stopPropagation()
    e.preventDefault()
    const startY = e.clientY
    const startX = e.clientX
    const initialDay = new Date(event.startTime)
    if (mode === 'move') {
      setDragging({
        id: event.id,
        startY,
        startX,
        originalStart: event.startTime,
        originalEnd: event.endTime,
        originalDay: formatDate(initialDay),
      })
    } else if (mode === 'resize') {
      setResizing({ id: event.id, startY, originalEnd: event.endTime })
    }

    const handleMove = (me) => {
      const deltaMin = Math.round((me.clientY - startY) / 1.2 / 15) * 15
      const deltaDay = Math.round((me.clientX - startX) / 180)
      if (mode === 'move' && draggingRef()) {
        const d = draggingRef()
        const origStart = new Date(d.originalStart)
        const origEnd = new Date(d.originalEnd)
        const duration = origEnd.getTime() - origStart.getTime()
        let newStart = new Date(origStart.getTime() + deltaMin * 60 * 1000)
        newStart = new Date(newStart.getTime() + deltaDay * 24 * 60 * 60 * 1000)
        const newEnd = new Date(newStart.getTime() + duration)
        const weekStart = weekDates[0]
        const weekEnd = weekDates[6]
        const weekEndEOD = new Date(weekEnd)
        weekEndEOD.setHours(23, 59, 59, 999)
        if (newStart >= weekStart && newEnd <= weekEndEOD) {
          onEventDrop && onEventDrop(d.id, newStart.toISOString(), newEnd.toISOString())
        }
      } else if (mode === 'resize' && resizingRef()) {
        const r = resizingRef()
        const origEnd = new Date(r.originalEnd)
        const newEnd = new Date(origEnd.getTime() + deltaMin * 60 * 1000)
        const foundEvent = events.find((ev) => ev.id === r.id)
        if (foundEvent && newEnd.getTime() > new Date(foundEvent.startTime).getTime()) {
          onEventDrop && onEventDrop(r.id, foundEvent.startTime, newEnd.toISOString())
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
        <div className="cal-week-columns">
          {weekDates.map((dayDate, dayIdx) => {
            const dayEvents = weekEvents.filter((e) => isSameDay(e.startTime, dayDate))
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
                    const startMin = getMinutesFromStart(event.startTime)
                    const duration = getEventDurationMinutes(event)
                    const top = startMin * (HOUR_HEIGHT / 60)
                    const height = Math.max(24, duration * (HOUR_HEIGHT / 60) - 2)
                    const isMatched = matchedIds.has(event.id)
                    return (
                      <div
                        key={event.id}
                        className={`cal-event cal-event-compact ${
                          isMatched ? 'cal-event-highlighted' : ''
                        } ${dragging?.id === event.id ? 'cal-event-dragging' : ''}`}
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
            )
          })}
        </div>
      </div>
    </div>
  )
}
