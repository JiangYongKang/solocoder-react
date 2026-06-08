import { MEETING_ROOMS, VIEW_MODES } from './constants.js'
import { formatTimeRange, sortBookingsByDateTime, filterBookingsByUser } from './meetingRoomUtils.js'

function getRoomName(roomId) {
  const room = MEETING_ROOMS.find((r) => r.id === roomId)
  return room ? room.name : roomId
}

export default function BookingList({ bookings, viewMode, currentUser, onEdit, onDelete }) {
  const displayBookings = viewMode === VIEW_MODES.MY_BOOKINGS
    ? filterBookingsByUser(bookings, currentUser)
    : bookings

  const sorted = sortBookingsByDateTime(displayBookings)

  if (sorted.length === 0) {
    return (
      <div className="mr-empty-state">
        <div className="mr-empty-icon">📭</div>
        <div className="mr-empty-text">
          {viewMode === VIEW_MODES.MY_BOOKINGS ? '您还没有任何预约记录' : '暂无任何预约记录'}
        </div>
      </div>
    )
  }

  return (
    <div className="mr-booking-list">
      {sorted.map((booking) => (
        <div key={booking.id} className="mr-booking-card">
          <div className="mr-booking-card-header">
            <div className="mr-booking-card-title">{booking.title}</div>
            <div className="mr-booking-card-actions">
              <button
                className="mr-btn mr-btn-ghost mr-btn-sm"
                onClick={() => onEdit(booking)}
              >
                编辑
              </button>
              <button
                className="mr-btn mr-btn-danger-outline mr-btn-sm"
                onClick={() => {
                  if (window.confirm('确定要取消该预约吗？')) {
                    onDelete(booking.id)
                  }
                }}
              >
                取消
              </button>
            </div>
          </div>
          <div className="mr-booking-card-body">
            <div className="mr-booking-info">
              <span className="mr-booking-info-label">会议室：</span>
              <span className="mr-booking-info-value">{getRoomName(booking.roomId)}</span>
            </div>
            <div className="mr-booking-info">
              <span className="mr-booking-info-label">日期：</span>
              <span className="mr-booking-info-value">{booking.date}</span>
            </div>
            <div className="mr-booking-info">
              <span className="mr-booking-info-label">时间：</span>
              <span className="mr-booking-info-value">
                {formatTimeRange(booking.startHour, booking.endHour)}
              </span>
            </div>
            <div className="mr-booking-info">
              <span className="mr-booking-info-label">预约人：</span>
              <span className="mr-booking-info-value">{booking.bookedBy}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
