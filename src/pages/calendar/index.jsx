import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import DayView from './DayView.jsx'
import WeekView from './WeekView.jsx'
import MonthView from './MonthView.jsx'
import EventModal from './EventModal.jsx'
import { VIEW_TYPES, VIEW_LABELS } from './constants.js'
import {
  loadEvents,
  saveEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  addDays,
  addMonths,
  startOfDay,
  formatDate,
  getMatchingEventIds,
} from './calendarUtils.js'
import './calendar.css'

export default function CalendarPage() {
  const [events, setEvents] = useState(() => loadEvents())
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()))
  const [viewType, setViewType] = useState(VIEW_TYPES.MONTH)
  const [searchQuery, setSearchQuery] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [defaultStartTime, setDefaultStartTime] = useState(null)
  const [defaultEndTime, setDefaultEndTime] = useState(null)
  const [modalKey, setModalKey] = useState(0)

  useEffect(() => {
    saveEvents(events)
  }, [events])

  const matchedIds = useMemo(
    () => getMatchingEventIds(events, searchQuery),
    [events, searchQuery]
  )

  const handleNavigate = (direction) => {
    if (viewType === VIEW_TYPES.DAY) {
      setCurrentDate((d) => addDays(d, direction))
    } else if (viewType === VIEW_TYPES.WEEK) {
      setCurrentDate((d) => addDays(d, direction * 7))
    } else {
      setCurrentDate((d) => addMonths(d, direction))
    }
  }

  const handleToday = () => {
    setCurrentDate(startOfDay(new Date()))
  }

  const getHeaderTitle = () => {
    const d = currentDate
    if (viewType === VIEW_TYPES.DAY) {
      return formatDate(d)
    } else if (viewType === VIEW_TYPES.WEEK) {
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${formatDate(weekStart)} ~ ${formatDate(weekEnd)}`
    } else {
      return `${d.getFullYear()}年${d.getMonth() + 1}月`
    }
  }

  const openNewEventModal = (start, end) => {
    setEditingEvent(null)
    setDefaultStartTime(start || null)
    setDefaultEndTime(end || null)
    setModalKey((k) => k + 1)
    setModalOpen(true)
  }

  const openEditEventModal = (event) => {
    setEditingEvent(event)
    setDefaultStartTime(null)
    setDefaultEndTime(null)
    setModalKey((k) => k + 1)
    setModalOpen(true)
  }

  const handleSaveEvent = (payload) => {
    if (editingEvent) {
      setEvents((prev) => {
        const result = updateEvent(prev, editingEvent.id, payload)
        return result.success ? result.events : prev
      })
    } else {
      setEvents((prev) => {
        const result = createEvent(prev, payload)
        return result.success ? result.events : prev
      })
    }
    setModalOpen(false)
    setEditingEvent(null)
  }

  const handleDeleteEvent = () => {
    if (editingEvent) {
      setEvents((prev) => {
        const result = deleteEvent(prev, editingEvent.id)
        return result.events
      })
      setModalOpen(false)
      setEditingEvent(null)
    }
  }

  const handleEventDrop = (eventId, newStart, newEnd) => {
    setEvents((prev) => {
      const result = updateEvent(prev, eventId, {
        startTime: newStart,
        endTime: newEnd,
      })
      return result.success ? result.events : prev
    })
  }

  const handleDayClick = (date) => {
    const start = new Date(date)
    start.setHours(9, 0, 0, 0)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    openNewEventModal(start, end)
  }

  const renderView = () => {
    const commonProps = {
      date: currentDate,
      events,
      matchedIds,
      onEventClick: openEditEventModal,
    }

    if (viewType === VIEW_TYPES.DAY) {
      return (
        <DayView
          {...commonProps}
          onSlotClick={(start, end) => openNewEventModal(start, end)}
          onEventDrop={handleEventDrop}
        />
      )
    } else if (viewType === VIEW_TYPES.WEEK) {
      return (
        <WeekView
          {...commonProps}
          onSlotClick={(start, end) => openNewEventModal(start, end)}
          onEventDrop={handleEventDrop}
        />
      )
    } else {
      return (
        <MonthView
          {...commonProps}
          onDayClick={handleDayClick}
        />
      )
    }
  }

  return (
    <div className="cal-page">
      <div className="cal-header">
        <div className="cal-header-left">
          <Link to="/" className="cal-back-link">← 返回首页</Link>
          <h1 className="cal-title">日程日历</h1>
        </div>
        <div className="cal-header-actions">
          <button className="cal-btn cal-btn-primary" onClick={() => openNewEventModal()}>
            + 新建事件
          </button>
        </div>
      </div>

      <div className="cal-toolbar">
        <div className="cal-toolbar-left">
          <button className="cal-btn cal-btn-ghost" onClick={handleToday}>
            今天
          </button>
          <div className="cal-nav-buttons">
            <button className="cal-btn cal-btn-icon" onClick={() => handleNavigate(-1)} aria-label="上一页">
              ‹
            </button>
            <button className="cal-btn cal-btn-icon" onClick={() => handleNavigate(1)} aria-label="下一页">
              ›
            </button>
          </div>
          <div className="cal-current-title">{getHeaderTitle()}</div>
        </div>
        <div className="cal-toolbar-right">
          <input
            type="text"
            className="cal-search-input"
            placeholder="搜索事件..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="cal-view-tabs">
        {Object.values(VIEW_TYPES).map((view) => (
          <button
            key={view}
            className={`cal-view-tab ${viewType === view ? 'cal-view-tab-active' : ''}`}
            onClick={() => setViewType(view)}
          >
            {VIEW_LABELS[view]}
          </button>
        ))}
      </div>

      <div className="cal-view-container">{renderView()}</div>

      <EventModal
        key={modalKey}
        isOpen={modalOpen}
        event={editingEvent}
        defaultStartTime={defaultStartTime}
        defaultEndTime={defaultEndTime}
        allEvents={events}
        onClose={() => {
          setModalOpen(false)
          setEditingEvent(null)
        }}
        onSave={handleSaveEvent}
        onDelete={editingEvent ? handleDeleteEvent : null}
      />
    </div>
  )
}
