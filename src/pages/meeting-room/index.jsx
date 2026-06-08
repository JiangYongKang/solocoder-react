import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import BookingForm from './BookingForm.jsx'
import BookingList from './BookingList.jsx'
import {
  MEETING_ROOMS,
  VIEW_MODES,
  VIEW_MODE_LABELS,
  START_HOUR,
  END_HOUR,
} from './constants.js'
import {
  formatDate,
  formatTime,
  formatTimeRange,
  getTimeSlots,
  getHoursRange,
  getCurrentUser,
  setCurrentUser,
  loadBookings,
  saveBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  isSlotBooked,
  getBookingForSlot,
  areHoursConsecutive,
  hoursToRange,
  cleanupExpiredBookings,
} from './meetingRoomUtils.js'
import './meeting-room.css'

export default function MeetingRoomPage() {
  const [bookings, setBookings] = useState(() => loadBookings())
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()))
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('all')
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID)
  const [currentUser, setCurrentUserName] = useState(() => getCurrentUser())

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState(null)
  const [formDefaults, setFormDefaults] = useState({
    roomId: null,
    date: null,
    startHour: null,
    endHour: null,
  })

  const [selectedSlots, setSelectedSlots] = useState(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const dragRoomRef = useRef(null)
  const dragStartHourRef = useRef(null)

  useEffect(() => {
    saveBookings(bookings)
  }, [bookings])

  useEffect(() => {
    const interval = setInterval(() => {
      setBookings((prev) => {
        const cleaned = cleanupExpiredBookings(prev)
        return cleaned.length === prev.length ? prev : cleaned
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleUserChange = (e) => {
    const name = e.target.value
    setCurrentUserName(name)
    setCurrentUser(name)
  }

  const timeSlots = useMemo(() => getTimeSlots(), [])

  const displayedRooms = useMemo(() => {
    if (selectedRoomFilter === 'all') return MEETING_ROOMS
    return MEETING_ROOMS.filter((r) => r.id === selectedRoomFilter)
  }, [selectedRoomFilter])

  const clearSelection = () => {
    setSelectedSlots(new Set())
    dragRoomRef.current = null
    dragStartHourRef.current = null
    setIsDragging(false)
  }

  const slotKey = (roomId, hour) => `${roomId}-${hour}`

  const handleSlotMouseDown = (roomId, hour, booked) => {
    if (booked) return
    clearSelection()
    setIsDragging(true)
    dragRoomRef.current = roomId
    dragStartHourRef.current = hour
    setSelectedSlots(new Set([slotKey(roomId, hour)]))
  }

  const handleSlotMouseEnter = (roomId, hour, booked) => {
    if (!isDragging || !dragRoomRef.current || dragRoomRef.current !== roomId) return
    if (booked) return
    const startHour = dragStartHourRef.current
    if (startHour == null) return
    const minH = Math.min(startHour, hour)
    const maxH = Math.max(startHour, hour)
    const newSet = new Set()
    for (let h = minH; h <= maxH; h++) {
      if (!isSlotBooked(bookings, roomId, selectedDate, h)) {
        newSet.add(slotKey(roomId, h))
      }
    }
    setSelectedSlots(newSet)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (selectedSlots.size > 0 && dragRoomRef.current != null) {
      const hours = []
      selectedSlots.forEach((key) => {
        const [, hStr] = key.split('-')
        hours.push(Number(hStr))
      })
      if (areHoursConsecutive(hours)) {
        const range = hoursToRange(hours)
        if (range) {
          setFormDefaults({
            roomId: dragRoomRef.current,
            date: selectedDate,
            startHour: range.startHour,
            endHour: range.endHour,
          })
          setEditingBooking(null)
          setModalOpen(true)
        }
      }
    }
    dragRoomRef.current = null
    dragStartHourRef.current = null
  }

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  })

  const handleSlotClick = (booking) => {
    if (booking) {
      setEditingBooking(booking)
      setFormDefaults({ roomId: null, date: null, startHour: null, endHour: null })
      setModalOpen(true)
    }
  }

  const openNewBooking = () => {
    clearSelection()
    setEditingBooking(null)
    setFormDefaults({
      roomId: MEETING_ROOMS[0].id,
      date: selectedDate,
      startHour: START_HOUR,
      endHour: START_HOUR + 1,
    })
    setModalOpen(true)
  }

  const handleSaveBooking = (payload) => {
    if (editingBooking) {
      setBookings((prev) => {
        const result = updateBooking(prev, editingBooking.id, payload)
        return result.success ? result.bookings : prev
      })
    } else {
      setBookings((prev) => {
        const result = createBooking(prev, payload)
        return result.success ? result.bookings : prev
      })
    }
    setModalOpen(false)
    setEditingBooking(null)
    clearSelection()
  }

  const handleDeleteBooking = (id) => {
    setBookings((prev) => {
      const result = deleteBooking(prev, id)
      return result.bookings
    })
    if (editingBooking && editingBooking.id === id) {
      setModalOpen(false)
      setEditingBooking(null)
    }
    clearSelection()
  }

  const renderTimeGrid = () => (
    <div
      className="mr-grid-container"
      onMouseLeave={() => {
        if (isDragging) {
          setIsDragging(false)
          clearSelection()
        }
      }}
    >
      <div className="mr-grid-header">
        <div className="mr-grid-corner">会议室 / 时间</div>
        {timeSlots.map((slot) => (
          <div key={slot.start} className="mr-grid-time-header">
            {formatTime(slot.start)}
          </div>
        ))}
      </div>
      {displayedRooms.map((room) => (
        <div key={room.id} className="mr-grid-row">
          <div className="mr-grid-room-header">
            <div className="mr-grid-room-name">{room.name}</div>
            <div className="mr-grid-room-capacity">{room.capacity}人</div>
          </div>
          {getHoursRange(START_HOUR, END_HOUR).map((hour) => {
            const booked = isSlotBooked(bookings, room.id, selectedDate, hour)
            const booking = booked ? getBookingForSlot(bookings, room.id, selectedDate, hour) : null
            const isFirstSlot = booking && booking.startHour === hour
            const span = booking ? booking.endHour - booking.startHour : 1
            const selected = selectedSlots.has(slotKey(room.id, hour))

            if (booked && !isFirstSlot) return null

            const cellClass = [
              'mr-grid-cell',
              booked ? 'mr-grid-cell-booked' : 'mr-grid-cell-free',
              selected ? 'mr-grid-cell-selected' : '',
              !booked && isDragging ? 'mr-grid-cell-draggable' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <div
                key={hour}
                className={cellClass}
                style={booked ? { gridColumn: `span ${span}` } : undefined}
                onMouseDown={() => handleSlotMouseDown(room.id, hour, booked)}
                onMouseEnter={() => handleSlotMouseEnter(room.id, hour, booked)}
                onClick={() => booked && handleSlotClick(booking)}
                title={booked ? `${booking.bookedBy}：${booking.title}（${formatTimeRange(booking.startHour, booking.endHour)}）` : formatTime(hour)}
              >
                {booked ? (
                  <div className="mr-booking-label">
                    <div className="mr-booking-label-name">{booking.bookedBy}</div>
                    <div className="mr-booking-label-title">{booking.title}</div>
                  </div>
                ) : (
                  <div className="mr-free-label">{formatTime(hour)}</div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )

  const renderLegend = () => (
    <div className="mr-legend">
      <div className="mr-legend-item">
        <span className="mr-legend-color mr-legend-free"></span>
        <span>空闲</span>
      </div>
      <div className="mr-legend-item">
        <span className="mr-legend-color mr-legend-booked"></span>
        <span>已预约</span>
      </div>
      <div className="mr-legend-item">
        <span className="mr-legend-color mr-legend-selected"></span>
        <span>已选择</span>
      </div>
    </div>
  )

  return (
    <div className="mr-page">
      <div className="mr-header">
        <div className="mr-header-left">
          <Link to="/" className="mr-back-link">← 返回首页</Link>
          <h1 className="mr-title">会议室预约系统</h1>
        </div>
        <div className="mr-header-right">
          <div className="mr-user-box">
            <span className="mr-user-label">当前用户：</span>
            <input
              type="text"
              className="mr-user-input"
              value={currentUser}
              onChange={handleUserChange}
              placeholder="输入用户名"
              maxLength={20}
            />
          </div>
          <button className="mr-btn mr-btn-primary" onClick={openNewBooking}>
            + 新建预约
          </button>
        </div>
      </div>

      <div className="mr-toolbar">
        <div className="mr-toolbar-left">
          <div className="mr-date-picker-box">
            <label className="mr-toolbar-label">选择日期：</label>
            <input
              type="date"
              className="mr-date-input"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value)
                clearSelection()
              }}
            />
          </div>
          <div className="mr-filter-box">
            <label className="mr-toolbar-label">会议室筛选：</label>
            <select
              className="mr-filter-select"
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
            >
              <option value="all">全部会议室</option>
              {MEETING_ROOMS.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {viewMode === VIEW_MODES.GRID && renderLegend()}
      </div>

      <div className="mr-view-tabs">
        {Object.values(VIEW_MODES).map((mode) => (
          <button
            key={mode}
            className={`mr-view-tab ${viewMode === mode ? 'mr-view-tab-active' : ''}`}
            onClick={() => setViewMode(mode)}
          >
            {VIEW_MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      <div className="mr-view-container">
        {viewMode === VIEW_MODES.GRID && renderTimeGrid()}
        {(viewMode === VIEW_MODES.MY_BOOKINGS || viewMode === VIEW_MODES.ALL_BOOKINGS) && (
          <BookingList
            bookings={bookings}
            viewMode={viewMode}
            currentUser={currentUser}
            onEdit={(b) => {
              setEditingBooking(b)
              setFormDefaults({ roomId: null, date: null, startHour: null, endHour: null })
              setModalOpen(true)
            }}
            onDelete={handleDeleteBooking}
          />
        )}
      </div>

      <BookingForm
        isOpen={modalOpen}
        booking={editingBooking}
        defaultRoomId={formDefaults.roomId}
        defaultDate={formDefaults.date}
        defaultStartHour={formDefaults.startHour}
        defaultEndHour={formDefaults.endHour}
        allBookings={bookings}
        onClose={() => {
          setModalOpen(false)
          setEditingBooking(null)
          clearSelection()
        }}
        onSave={handleSaveBooking}
        onDelete={editingBooking ? () => handleDeleteBooking(editingBooking.id) : null}
      />
    </div>
  )
}
