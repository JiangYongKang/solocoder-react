import { WEEKDAY_LABELS } from './constants.js'
import {
  getMonthGridDates,
  filterEventsByMonth,
  isSameDay,
  isSameMonth,
  isToday,
  formatTime,
} from './calendarUtils.js'

const MAX_VISIBLE_EVENTS = 3

export default function MonthView({ date, events, matchedIds, onEventClick, onDayClick }) {
  const gridDates = getMonthGridDates(date)
  const monthEvents = filterEventsByMonth(events, date)

  const getDayEvents = (dayDate) => {
    return monthEvents.filter((e) => isSameDay(e.startTime, dayDate))
  }

  return (
    <div className="cal-month-view">
      <div className="cal-month-header">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="cal-month-weekday">
            {label}
          </div>
        ))}
      </div>
      <div className="cal-month-grid">
        {gridDates.map((dayDate, idx) => {
          const dayEvents = getDayEvents(dayDate)
          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS)
          const moreCount = dayEvents.length - MAX_VISIBLE_EVENTS
          const inMonth = isSameMonth(dayDate, date)
          const today = isToday(dayDate)

          return (
            <div
              key={idx}
              className={`cal-month-day ${inMonth ? '' : 'cal-month-day-other'} ${
                today ? 'cal-month-day-today' : ''
              }`}
              onClick={() => onDayClick && onDayClick(dayDate)}
            >
              <div className="cal-month-day-number">{dayDate.getDate()}</div>
              <div className="cal-month-events">
                {visibleEvents.map((event) => {
                  const isMatched = matchedIds.has(event.id)
                  return (
                    <div
                      key={event.id}
                      className={`cal-month-event ${isMatched ? 'cal-event-highlighted' : ''}`}
                      style={{ backgroundColor: event.color + '30', borderLeftColor: event.color }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick && onEventClick(event)
                      }}
                    >
                      <span className="cal-month-event-time">{formatTime(event.startTime)}</span>
                      <span className="cal-month-event-title">{event.title}</span>
                    </div>
                  )
                })}
                {moreCount > 0 && (
                  <div className="cal-month-more">+{moreCount} 更多</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
