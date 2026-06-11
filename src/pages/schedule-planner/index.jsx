import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ScheduleGrid from './ScheduleGrid.jsx';
import CoursePool from './CoursePool.jsx';
import CourseModal from './CourseModal.jsx';
import ConflictPanel from './ConflictPanel.jsx';
import PrintView from './PrintView.jsx';
import {
  loadState,
  saveState,
  addCourse,
  updateCourse,
  deleteCourse,
  scheduleCourse,
  unscheduleCourse,
  findCourse,
  getUnscheduledCourses,
  canPlaceCourseAt,
  detectAllConflicts,
  exportToJSON,
  importFromJSON,
  addClassroom,
  addTeacher,
  WEEK_TYPE,
} from './scheduleUtils.js';
import './schedule-planner.css';

export default function SchedulePlannerPage() {
  const [state, setState] = useState(() => loadState());
  const [draggingCourseId, setDraggingCourseId] = useState(null);
  const [dropPreview, setDropPreview] = useState(null);
  const [invalidDropCells, setInvalidDropCells] = useState([]);
  const [toast, setToast] = useState(null);
  const [showPrint, setShowPrint] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalCourse, setModalCourse] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const fileInputRef = useRef(null);

  const unscheduledCourses = useMemo(() => getUnscheduledCourses(state), [state]);
  const conflicts = useMemo(() => detectAllConflicts(state), [state]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleDragStart = (e, course) => {
    setDraggingCourseId(course.id);
    try {
      e.dataTransfer.setData('text/plain', course.id);
    } catch {
      // ignore
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingCourseId(null);
    setDropPreview(null);
    setInvalidDropCells([]);
  };

  const handleCellDragOver = (dayIdx, slotIdx) => {
    if (!draggingCourseId) return;

    const result = canPlaceCourseAt(state, draggingCourseId, dayIdx, slotIdx);
    if (result.canPlace) {
      setDropPreview({ dayIndex: dayIdx, slotIndex: slotIdx });
      setInvalidDropCells([]);
    } else {
      setDropPreview(null);
      const course = findCourse(state, draggingCourseId);
      if (course) {
        const cells = [];
        for (let i = 0; i < course.duration; i++) {
          cells.push({ dayIndex: dayIdx, slotIndex: slotIdx + i });
        }
        setInvalidDropCells(cells);
      }
    }
  };

  const handleCellDragLeave = () => {
    setDropPreview(null);
    setInvalidDropCells([]);
  };

  const handleCellDrop = (dayIdx, slotIdx) => {
    if (!draggingCourseId) return;

    const course = findCourse(state, draggingCourseId);
    if (!course) return;

    const result = canPlaceCourseAt(state, draggingCourseId, dayIdx, slotIdx);
    if (!result.canPlace) {
      showToast(result.reason, 'error');
      setDropPreview(null);
      setInvalidDropCells([]);
      setDraggingCourseId(null);
      return;
    }

    const placement = {
      dayIndex: dayIdx,
      slotIndex: slotIdx,
      weekType: course.scheduled?.weekType || WEEK_TYPE.ALL,
    };

    setState((prev) => scheduleCourse(prev, draggingCourseId, placement));
    setDropPreview(null);
    setInvalidDropCells([]);
    setDraggingCourseId(null);
    showToast(`已排课：${course.name}`, 'success');
  };

  const handleCourseClick = (course) => {
    setModalCourse(course);
    setModalMode('detail');
    setModalOpen(true);
  };

  const handleAddCourse = () => {
    setModalCourse(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEditCourse = (course) => {
    setModalCourse(course);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleModalSave = (saveData, switchToEdit) => {
    if (switchToEdit) {
      setModalMode('edit');
      return;
    }

    if (modalMode === 'create') {
      setState((prev) => {
        let newState = addCourse(prev, saveData);
        if (saveData?.classroom) newState = addClassroom(newState, saveData.classroom);
        if (saveData?.teacher) newState = addTeacher(newState, saveData.teacher);
        return newState;
      });
      showToast('课程创建成功', 'success');
    } else if (modalMode === 'edit' && modalCourse) {
      setState((prev) => {
        let newState = updateCourse(prev, modalCourse.id, saveData);
        if (saveData?.classroom) newState = addClassroom(newState, saveData.classroom);
        if (saveData?.teacher) newState = addTeacher(newState, saveData.teacher);
        return newState;
      });
      showToast('课程更新成功', 'success');
    }

    setModalOpen(false);
    setModalCourse(null);
  };

  const handleModalDelete = (course) => {
    if (!course) return;
    setState((prev) => deleteCourse(prev, course.id));
    showToast(`已删除：${course.name}`, 'success');
    setModalOpen(false);
    setModalCourse(null);
  };

  const handleModalUnschedule = (course) => {
    if (!course) return;
    setState((prev) => unscheduleCourse(prev, course.id));
    showToast(`已从课表移除：${course.name}`, 'success');
    setModalOpen(false);
    setModalCourse(null);
  };

  const handleExportJSON = () => {
    const jsonString = exportToJSON(state);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `课程表_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('导出成功', 'success');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const result = importFromJSON(text);
      if (!result.valid) {
        showToast(`导入失败：${result.errors.join('；')}`, 'error');
        return;
      }
      setState(result.state);
      showToast(`导入成功，共 ${result.state.courses.length} 门课程`, 'success');
    } catch (err) {
      showToast(`文件读取失败：${err.message}`, 'error');
    }
  };

  const handleReset = () => {
    if (confirm('确定要清空所有排课信息吗？未排课的课程将保留。')) {
      setState((prev) => ({
        ...prev,
        courses: prev.courses.map((c) => ({ ...c, scheduled: null })),
      }));
      showToast('已清空所有排课', 'success');
    }
  };

  const handleScheduledCourseDragStart = (e, course) => {
    handleDragStart(e, course);
  };

  if (showPrint) {
    return <PrintView state={state} onBack={() => setShowPrint(false)} />;
  }

  return (
    <div className="schedule-planner">
      <div className="schedule-planner-header">
        <h1>📅 课程表排课</h1>
        <div className="schedule-planner-toolbar">
          <button type="button" className="schedule-toolbar-btn" onClick={handleAddCourse}>
            + 新建课程
          </button>
          <button type="button" className="schedule-toolbar-btn" onClick={handleExportJSON}>
            📤 导出 JSON
          </button>
          <button type="button" className="schedule-toolbar-btn" onClick={handleImportClick}>
            📥 导入 JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <button type="button" className="schedule-toolbar-btn danger" onClick={handleReset}>
            🔄 清空排课
          </button>
          <button type="button" className="schedule-toolbar-btn primary" onClick={() => setShowPrint(true)}>
            🖨️ 打印视图
          </button>
        </div>
      </div>

      <div className="schedule-planner-body">
        <CoursePool
          unscheduledCourses={unscheduledCourses}
          draggingCourseId={draggingCourseId}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onAddCourse={handleAddCourse}
          onEditCourse={handleEditCourse}
        />

        <ScheduleGrid
          state={state}
          draggingCourseId={draggingCourseId}
          dropPreview={dropPreview}
          invalidDropCells={invalidDropCells}
          onCourseClick={handleCourseClick}
          onCellDragOver={handleCellDragOver}
          onCellDrop={handleCellDrop}
          onCellDragLeave={handleCellDragLeave}
        />
      </div>

      <ConflictPanel conflicts={conflicts} />

      {modalOpen && (
        <CourseModal
          course={modalCourse}
          mode={modalMode}
          state={state}
          onClose={() => {
            setModalOpen(false);
            setModalCourse(null);
          }}
          onSave={handleModalSave}
          onDelete={handleModalDelete}
          onUnschedule={handleModalUnschedule}
        />
      )}

      {toast && (
        <div className={`schedule-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
