import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatPrice, formatChange, formatPercent, getPriceColor, validateStockCode } from './stockUtils'
import { ALERT_STATUS_ENABLED, ALERT_STATUS_TRIGGERED } from './constants'

const SortableItem = ({ stock, isActive, hasAlert, onClick, onDelete, onSetAlert, id }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const priceColor = getPriceColor(stock.change)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`watchlist-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <span className="drag-handle" {...attributes} {...listeners}>
        ⋮⋮
      </span>
      <div className="stock-info">
        <div className="stock-name-row">
          <span className="stock-name">{stock.name}</span>
          <span className="stock-code">{stock.code}</span>
          {hasAlert && <span className="alert-bell">🔔</span>}
        </div>
        <div className="stock-price-row">
          <span className={`stock-price ${priceColor}`}>
            {formatPrice(stock.price)}
          </span>
          <div className={`stock-change ${priceColor}`}>
            <div>{formatChange(stock.change)}</div>
            <div>{formatPercent(stock.changePercent)}</div>
          </div>
        </div>
      </div>
      <div className="stock-actions" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn" title="设置预警" onClick={onSetAlert}>
          ⚙
        </button>
        <button className="icon-btn danger" title="删除" onClick={onDelete}>
          ✕
        </button>
      </div>
    </div>
  )
}

const Watchlist = ({
  watchlist,
  stocks,
  selectedCode,
  alerts,
  onSelect,
  onAddStock,
  onDeleteStock,
  onReorder,
  onSetAlert,
}) => {
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddStock = () => {
    if (!validateStockCode(newCode)) {
      alert('请输入有效的股票代码（如 AAPL、GOOGL、000001、600519）')
      return
    }
    if (!newName.trim()) {
      alert('请输入股票名称')
      return
    }
    const code = newCode.trim().toUpperCase()
    if (watchlist.some((s) => s.code === code)) {
      alert('该股票已在自选列表中')
      return
    }
    onAddStock({ code, name: newName.trim() })
    setNewCode('')
    setNewName('')
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = watchlist.findIndex((s) => s.code === active.id)
      const newIndex = watchlist.findIndex((s) => s.code === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(watchlist, oldIndex, newIndex))
      }
    }
  }

  const hasActiveAlert = (code) => {
    return alerts.some(
      (a) => a.stockCode === code &&
        (a.status === ALERT_STATUS_ENABLED || a.status === ALERT_STATUS_TRIGGERED)
    )
  }

  const getStockData = (code) => {
    return stocks.find((s) => s.code === code) || { code, name: '', price: 0, change: 0, changePercent: 0 }
  }

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">自选股</h3>
        <div className="add-stock-form">
          <input
            type="text"
            placeholder="股票代码 (如 AAPL)"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStock()}
          />
        </div>
        <div className="add-stock-form">
          <input
            type="text"
            placeholder="股票名称"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStock()}
          />
        </div>
        <button className="add-stock-btn" onClick={handleAddStock}>
          添加自选
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={watchlist.map((s) => s.code)}
          strategy={verticalListSortingStrategy}
        >
          <div className="watchlist">
            {watchlist.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div>暂无自选股</div>
              </div>
            ) : (
              watchlist.map((item) => {
                const stockData = getStockData(item.code)
                return (
                  <SortableItem
                    key={item.code}
                    id={item.code}
                    stock={{ ...item, ...stockData }}
                    isActive={selectedCode === item.code}
                    hasAlert={hasActiveAlert(item.code)}
                    onClick={() => onSelect(item.code)}
                    onDelete={() => onDeleteStock(item.code)}
                    onSetAlert={() => onSetAlert(item.code)}
                  />
                )
              })
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

export default Watchlist
