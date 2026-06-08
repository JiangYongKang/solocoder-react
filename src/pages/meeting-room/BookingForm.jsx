import { useState, useEffect } from 'react'
import { MEETING_ROOMS, START_HOUR, END_HOUR } from './constants.js'
import { formatTime, formatTimeRange, validateBooking } from './meetingRoomUtils.js'

function hourOptions() {
  const options = []
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    options.push(h)
  }
  return options
}

export default function BookingForm({
  isOpen,
  booking,
  defaultRoomId,
  defaultDate,
  defaultStartHour,
  defaultEndHour,
  allBookings,
  onClose,
  onSave,
  onDelete,
}) {
  const [formData, setFormData] = useState({
    bookedBy: '',
    title: '',
    roomId: MEETING_ROOMS[0].id,
    date: '',
    startHour: START_HOUR,
    endHour: START_HOUR + 1,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      if (booking) {
        setFormData({
          bookedBy: booking.bookedBy || '',
          title: booking.title || '',
          roomId: booking.roomId || MEETING_ROOMS[0].id,
          date: booking.date || '',
          startHour: booking.startHour ?? START_HOUR,
          endHour: booking.endHour ?? START_HOUR + 1,
        })
      } else {
        setFormData({
          bookedBy: '',
          title: '',
          roomId: defaultRoomId || MEETING_ROOMS[0].id,
          date: defaultDate || '',
          startHour: defaultStartHour ?? START_HOUR,
          endHour: defaultEndHour ?? START_HOUR + 1,
        })
      }
      setErrors({})
    }
  }, [isOpen, booking, defaultRoomId, defaultDate, defaultStartHour, defaultEndHour])

  if (!isOpen) return null

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { valid, errors: validationErrors } = validateBooking(formData, allBookings, booking?.id)
    if (!valid) {
      setErrors(validationErrors)
      return
    }
    onSave(formData)
  }

  const startOptions = hourOptions().filter((h) => h < END_HOUR)
  const endOptions = hourOptions().filter((h) => h > formData.startHour)

  return (
    <div className="mr-modal-overlay" onClick={onClose}>
      <div className="mr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mr-modal-header">
          <h2 className="mr-modal-title">{booking ? '编辑预约' : '新建预约'}</h2>
          <button className="mr-modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <form className="mr-form" onSubmit={handleSubmit}>
          <div className="mr-form-row">
            <label className="mr-form-label">预约人姓名</label>
            <input
              type="text"
              className={`mr-form-input ${errors.bookedBy ? 'mr-input-error' : ''}`}
              value={formData.bookedBy}
              onChange={(e) => handleChange('bookedBy', e.target.value)}
              placeholder="请输入预约人姓名"
              maxLength={50}
            />
            {errors.bookedBy && <div className="mr-form-error">{errors.bookedBy}</div>}
          </div>

          <div className="mr-form-row">
            <label className="mr-form-label">会议标题</label>
            <input
              type="text"
              className={`mr-form-input ${errors.title ? 'mr-input-error' : ''}`}
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="请输入会议标题"
              maxLength={200}
            />
            {errors.title && <div className="mr-form-error">{errors.title}</div>}
          </div>

          <div className="mr-form-row">
            <label className="mr-form-label">会议室</label>
            <select
              className={`mr-form-select ${errors.roomId ? 'mr-input-error' : ''}`}
              value={formData.roomId}
              onChange={(e) => handleChange('roomId', e.target.value)}
            >
              {MEETING_ROOMS.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}（{room.capacity}人）
                </option>
              ))}
            </select>
            {errors.roomId && <div className="mr-form-error">{errors.roomId}</div>}
          </div>

          <div className="mr-form-row">
            <label className="mr-form-label">日期</label>
            <input
              type="date"
              className={`mr-form-input ${errors.date ? 'mr-input-error' : ''}`}
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
            />
            {errors.date && <div className="mr-form-error">{errors.date}</div>}
          </div>

          <div className="mr-form-row mr-form-row-inline">
            <div className="mr-form-col">
              <label className="mr-form-label">开始时间</label>
              <select
                className={`mr-form-select ${errors.startHour ? 'mr-input-error' : ''}`}
                value={formData.startHour}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  handleChange('startHour', val)
                  if (formData.endHour <= val) {
                    handleChange('endHour', Math.min(val + 1, END_HOUR))
                  }
                }}
              >
                {startOptions.map((h) => (
                  <option key={h} value={h}>
                    {formatTime(h)}
                  </option>
                ))}
              </select>
              {errors.startHour && <div className="mr-form-error">{errors.startHour}</div>}
            </div>
            <div className="mr-form-col">
              <label className="mr-form-label">结束时间</label>
              <select
                className={`mr-form-select ${errors.endHour ? 'mr-input-error' : ''}`}
                value={formData.endHour}
                onChange={(e) => handleChange('endHour', Number(e.target.value))}
              >
                {endOptions.map((h) => (
                  <option key={h} value={h}>
                    {formatTime(h)}
                  </option>
                ))}
              </select>
              {errors.endHour && <div className="mr-form-error">{errors.endHour}</div>}
            </div>
          </div>

          {formData.startHour != null && formData.endHour != null && formData.endHour > formData.startHour && (
            <div className="mr-form-time-preview">
              已选时段：{formatTimeRange(formData.startHour, formData.endHour)}（
              {formData.endHour - formData.startHour}小时）
            </div>
          )}

          {errors.conflict && <div className="mr-form-error mr-conflict-error">{errors.conflict}</div>}

          <div className="mr-form-actions">
            {onDelete && booking && (
              <button
                type="button"
                className="mr-btn mr-btn-danger"
                onClick={() => {
                  if (window.confirm('确定要取消该预约吗？')) {
                    onDelete()
                  }
                }}
              >
                取消预约
              </button>
            )}
            <div className="mr-form-actions-right">
              <button type="button" className="mr-btn mr-btn-ghost" onClick={onClose}>
                取消
              </button>
              <button type="submit" className="mr-btn mr-btn-primary">
                {booking ? '保存修改' : '确认预约'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
