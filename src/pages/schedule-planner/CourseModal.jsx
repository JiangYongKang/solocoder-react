import { useState, useEffect } from 'react';
import {
  SUBJECT_COLORS,
  WEEK_TYPE,
  WEEK_TYPE_LABELS,
  WEEK_DAYS,
  TIME_SLOTS,
  TOTAL_SLOTS,
} from './constants.js';
import {
  validateCourse,
  formatScheduleRange,
  checkPlacementConflict,
} from './scheduleUtils.js';

export default function CourseModal({
  course,
  mode,
  state,
  onClose,
  onSave,
  onDelete,
  onUnschedule,
}) {
  const isEdit = mode === 'edit';
  const isDetail = mode === 'detail';

  const [formData, setFormData] = useState({
    name: '',
    teacher: '',
    classroom: '',
    duration: 2,
    credits: 0,
    subjectColorId: SUBJECT_COLORS[0].id,
    notes: '',
    scheduled: null,
    weekType: WEEK_TYPE.ALL,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name || '',
        teacher: course.teacher || '',
        classroom: course.classroom || '',
        duration: course.duration || 2,
        credits: course.credits ?? 0,
        subjectColorId: course.subjectColorId || SUBJECT_COLORS[0].id,
        notes: course.notes || '',
        scheduled: course.scheduled || null,
        weekType: course.scheduled?.weekType || WEEK_TYPE.ALL,
      });
    } else {
      setFormData({
        name: '',
        teacher: '',
        classroom: '',
        duration: 2,
        credits: 0,
        subjectColorId: SUBJECT_COLORS[0].id,
        notes: '',
        scheduled: null,
        weekType: WEEK_TYPE.ALL,
      });
    }
    setErrors({});
  }, [course, mode]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = () => {
    const dataToValidate = {
      ...formData,
      scheduled: formData.scheduled
        ? {
            ...formData.scheduled,
            weekType: formData.weekType,
          }
        : null,
    };
    const validation = validateCourse(dataToValidate);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    if (dataToValidate.scheduled && course) {
      const placement = {
        dayIndex: dataToValidate.scheduled.dayIndex,
        slotIndex: dataToValidate.scheduled.slotIndex,
        weekType: dataToValidate.weekType,
      };
      const conflictResult = checkPlacementConflict(
        {
          ...state,
          courses: state.courses.map((c) =>
            c.id === course.id
              ? {
                  ...c,
                  name: dataToValidate.name,
                  teacher: dataToValidate.teacher,
                  classroom: dataToValidate.classroom,
                  duration: dataToValidate.duration,
                }
              : c
          ),
        },
        course.id,
        placement
      );
      if (!conflictResult.valid) {
        setErrors({ scheduled: conflictResult.conflicts.map((c) => c.message).join('; ') });
        return;
      }
    }

    const saveData = {
      ...dataToValidate,
      subjectColorId: formData.subjectColorId,
    };

    onSave?.(saveData);
  };

  const handleRemoveFromSchedule = () => {
    onUnschedule?.(course);
  };

  const handleDelete = () => {
    onDelete?.(course);
  };

  const title = isDetail ? '课程详情' : isEdit ? '编辑课程' : '新建课程';

  return (
    <div className="schedule-modal-overlay" onClick={onClose}>
      <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
        <div className="schedule-modal-header">
          <h2>{title}</h2>
          <button type="button" className="schedule-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="schedule-modal-body">
          {isDetail ? (
            <>
              <div className="schedule-detail-item">
                <span className="schedule-detail-label">课程名称</span>
                <span className="schedule-detail-value">{course?.name || '-'}</span>
              </div>
              <div className="schedule-detail-item">
                <span className="schedule-detail-label">颜色标记</span>
                <span className="schedule-detail-value">
                  <span
                    className="schedule-detail-color-preview"
                    style={{
                      background: (SUBJECT_COLORS.find((c) => c.id === course?.subjectColorId) || SUBJECT_COLORS[0]).color,
                    }}
                  />
                  {(SUBJECT_COLORS.find((c) => c.id === course?.subjectColorId) || SUBJECT_COLORS[0]).name}
                </span>
              </div>
              <div className="schedule-detail-item">
                <span className="schedule-detail-label">授课教师</span>
                <span className="schedule-detail-value">{course?.teacher || '-'}</span>
              </div>
              <div className="schedule-detail-item">
                <span className="schedule-detail-label">上课教室</span>
                <span className="schedule-detail-value">{course?.classroom || '-'}</span>
              </div>
              <div className="schedule-detail-item">
                <span className="schedule-detail-label">课程时长</span>
                <span className="schedule-detail-value">{course?.duration || 0} 节</span>
              </div>
              <div className="schedule-detail-item">
                <span className="schedule-detail-label">学分</span>
                <span className="schedule-detail-value">{course?.credits ?? 0} 学分</span>
              </div>
              <div className="schedule-detail-item">
                <span className="schedule-detail-label">上课时间</span>
                <span className="schedule-detail-value">{formatScheduleRange(course)}</span>
              </div>
              {course?.notes && (
                <div className="schedule-detail-item">
                  <span className="schedule-detail-label">备注</span>
                  <span className="schedule-detail-value" style={{ whiteSpace: 'pre-wrap' }}>
                    {course.notes}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="schedule-form-group">
                <label>课程名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="请输入课程名称"
                />
                {errors.name && <div className="schedule-form-error">{errors.name}</div>}
              </div>

              <div className="schedule-form-row">
                <div className="schedule-form-group">
                  <label>授课教师</label>
                  <input
                    type="text"
                    value={formData.teacher}
                    onChange={(e) => handleChange('teacher', e.target.value)}
                    placeholder="教师姓名"
                    list="teacher-list"
                  />
                  <datalist id="teacher-list">
                    {state.teachers.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
                <div className="schedule-form-group">
                  <label>上课教室</label>
                  <input
                    type="text"
                    value={formData.classroom}
                    onChange={(e) => handleChange('classroom', e.target.value)}
                    placeholder="教室名称"
                    list="classroom-list"
                  />
                  <datalist id="classroom-list">
                    {state.classrooms.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="schedule-form-row">
                <div className="schedule-form-group">
                  <label>课程时长（节）*</label>
                  <input
                    type="number"
                    min="1"
                    max={TOTAL_SLOTS}
                    value={formData.duration}
                    onChange={(e) => handleChange('duration', parseInt(e.target.value) || 1)}
                  />
                  {errors.duration && <div className="schedule-form-error">{errors.duration}</div>}
                </div>
                <div className="schedule-form-group">
                  <label>学分</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.credits}
                    onChange={(e) => handleChange('credits', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="schedule-form-group">
                <label>颜色标记</label>
                <div className="schedule-color-picker">
                  {SUBJECT_COLORS.map((colorCfg) => (
                    <div
                      key={colorCfg.id}
                      className={`schedule-color-option ${formData.subjectColorId === colorCfg.id ? 'selected' : ''}`}
                      style={{ background: colorCfg.color }}
                      title={colorCfg.name}
                      onClick={() => handleChange('subjectColorId', colorCfg.id)}
                    />
                  ))}
                </div>
              </div>

              {formData.scheduled && (
                <>
                  <div className="schedule-form-row">
                    <div className="schedule-form-group">
                      <label>星期</label>
                      <select
                        value={formData.scheduled.dayIndex}
                        onChange={(e) =>
                          handleChange('scheduled', {
                            ...formData.scheduled,
                            dayIndex: parseInt(e.target.value),
                          })
                        }
                      >
                        {WEEK_DAYS.map((d, i) => (
                          <option key={i} value={i}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="schedule-form-group">
                      <label>开始节次</label>
                      <select
                        value={formData.scheduled.slotIndex}
                        onChange={(e) =>
                          handleChange('scheduled', {
                            ...formData.scheduled,
                            slotIndex: parseInt(e.target.value),
                          })
                        }
                      >
                        {TIME_SLOTS.filter((_, i) => i + formData.duration <= TOTAL_SLOTS).map((slot) => (
                          <option key={slot.index} value={slot.index}>
                            第{slot.index + 1}节 ({slot.startTime})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="schedule-form-group">
                    <label>周次</label>
                    <select
                      value={formData.weekType}
                      onChange={(e) => handleChange('weekType', e.target.value)}
                    >
                      {Object.entries(WEEK_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {errors.scheduled && <div className="schedule-form-error">{errors.scheduled}</div>}

              <div className="schedule-form-group">
                <label>备注</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="课程备注信息（可选）"
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <div className="schedule-modal-footer">
          {isDetail ? (
            <>
              <button
                type="button"
                className="schedule-toolbar-btn danger"
                onClick={handleRemoveFromSchedule}
              >
                从课表移除
              </button>
              <button type="button" className="schedule-toolbar-btn" onClick={onClose}>
                关闭
              </button>
              <button
                type="button"
                className="schedule-toolbar-btn primary"
                onClick={() => onSave?.(null, true)}
              >
                编辑
              </button>
            </>
          ) : (
            <>
              {isEdit && course?.scheduled && (
                <button
                  type="button"
                  className="schedule-toolbar-btn danger"
                  onClick={handleRemoveFromSchedule}
                >
                  从课表移除
                </button>
              )}
              {isEdit && (
                <button
                  type="button"
                  className="schedule-toolbar-btn danger"
                  onClick={handleDelete}
                >
                  删除课程
                </button>
              )}
              <button type="button" className="schedule-toolbar-btn" onClick={onClose}>
                取消
              </button>
              <button type="button" className="schedule-toolbar-btn primary" onClick={handleSubmit}>
                保存
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
