import { useState, useEffect, useRef } from 'react';

export default function ContextMenu({ x, y, task, allTasks, onAddDependency, onRemoveDependency, onAddSubtask, onDeleteTask, onClose }) {
  const [showDependencyMenu, setShowDependencyMenu] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);
  const submenuRef = useRef(null);
  const addDependencyItemRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        (!submenuRef.current || !submenuRef.current.contains(e.target))
      ) {
        onClose();
      }
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!task) return null;

  const availableDependencies = allTasks.filter(
    (t) => t.id !== task.id && !task.dependencies.includes(t.id)
  );

  const currentDependencies = allTasks.filter((t) => task.dependencies.includes(t.id));

  const handleDependencyItemEnter = () => {
    setShowDependencyMenu(true);
    if (addDependencyItemRef.current && menuRef.current) {
      const itemRect = addDependencyItemRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      setSubmenuPosition({
        x: menuRect.right + 4,
        y: itemRect.top,
      });
    }
  };

  return (
    <>
      <div
        ref={menuRef}
        className="gantt-context-menu"
        style={{ left: x, top: y, position: 'fixed' }}
      >
        <div
          className="gantt-context-menu-item"
          onClick={() => {
            onAddSubtask(task.id);
            onClose();
          }}
        >
          添加子任务
        </div>

        {currentDependencies.length > 0 && (
          <>
            <div className="gantt-context-menu-separator" />
            <div className="gantt-context-menu-item gantt-context-menu-item-disabled" style={{ fontWeight: 600 }}>
              移除依赖:
            </div>
            {currentDependencies.map((dep) => (
              <div
                key={dep.id}
                className="gantt-context-menu-item"
                onClick={() => {
                  onRemoveDependency(task.id, dep.id);
                  onClose();
                }}
              >
                └─ {dep.name}
              </div>
            ))}
          </>
        )}

        {availableDependencies.length > 0 && (
          <>
            <div className="gantt-context-menu-separator" />
            <div
              ref={addDependencyItemRef}
              className="gantt-context-menu-item"
              onMouseEnter={handleDependencyItemEnter}
              onMouseLeave={() => setShowDependencyMenu(false)}
            >
              添加依赖 →
            </div>
          </>
        )}

        <div className="gantt-context-menu-separator" />
        <div
          className="gantt-context-menu-item"
          style={{ color: '#ef4444' }}
          onClick={() => {
            onDeleteTask(task.id);
            onClose();
          }}
        >
          删除任务
        </div>
      </div>

      {showDependencyMenu && availableDependencies.length > 0 && (
        <div
          ref={submenuRef}
          className="gantt-dependency-submenu"
          style={{
            position: 'fixed',
            left: submenuPosition.x,
            top: submenuPosition.y,
          }}
          onMouseEnter={() => setShowDependencyMenu(true)}
          onMouseLeave={() => setShowDependencyMenu(false)}
        >
          <div className="gantt-dependency-submenu-header">选择前置任务</div>
          {availableDependencies.map((dep) => (
            <div
              key={dep.id}
              className="gantt-context-menu-item"
              onClick={() => {
                onAddDependency(task.id, dep.id);
                onClose();
              }}
            >
              {dep.name}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
