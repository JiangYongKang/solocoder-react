import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SEAT_STATUS,
  PRICE_ZONE_CONFIG,
  PERSON_COUNT,
  PERSON_COUNT_LABELS,
  LOCK_DURATION_SECONDS,
  TOTAL_ROWS,
  TOTAL_COLS,
  ZONE_ROWS,
} from './constants.js';
import {
  createSeatGrid,
  getRowLabel,
  getSeatTooltip,
  findAdjacentSeats,
  canSelectSeat,
  toggleSeatSelection,
  selectMultipleSeats,
  clearSelectedSeats,
  lockSelectedSeats,
  releaseSelectedSeats,
  getSeatsByIds,
  calculateTotalPrice,
  formatCountdown,
  getCountdownStatus,
  isTimeout,
  formatSeatGroups,
  saveSeatState,
  loadSeatState,
  clearSavedSeatState,
  restoreLockedSeats,
  handlePersonCountChange,
} from './seatSelectionCore.js';
import './seat-selection.css';

function SeatSelectionPage() {
  const navigate = useNavigate();

  const [grid, setGrid] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lockedIds, setLockedIds] = useState([]);
  const [personCount, setPersonCount] = useState(PERSON_COUNT.SINGLE);
  const [remainingTime, setRemainingTime] = useState(LOCK_DURATION_SECONDS);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [toast, setToast] = useState(null);
  const [lockStartTime, setLockStartTime] = useState(null);

  const timerRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const saved = loadSeatState();
    if (saved) {
      let loadedGrid = saved.grid || createSeatGrid();
      if (saved.lockedIds && saved.lockedIds.length > 0) {
        loadedGrid = restoreLockedSeats(loadedGrid, saved.lockedIds);
      }
      setGrid(loadedGrid);
      setSelectedIds(saved.selectedIds || []);
      setLockedIds(saved.lockedIds || []);
      setPersonCount(saved.personCount || PERSON_COUNT.SINGLE);
      setRemainingTime(saved.remainingTime || LOCK_DURATION_SECONDS);
      setIsConfirmed(saved.isConfirmed || false);
      if (saved.lockStartTime) {
        setLockStartTime(saved.lockStartTime);
      }
    } else {
      setGrid(createSeatGrid());
    }
    return () => clearSavedSeatState();
  }, []);

  useEffect(() => {
    if (!grid || isConfirmed) return;
    if (selectedIds.length > 0) {
      if (!timerRef.current) {
        setLockStartTime(Date.now());
        timerRef.current = setInterval(() => {
          setRemainingTime((t) => {
            const newTime = t - 1;
            if (newTime <= 0) {
              clearInterval(timerRef.current);
              timerRef.current = null;
              handleTimeout();
              return 0;
            }
            return newTime;
          });
        }, 1000);
      }
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [selectedIds.length > 0, isConfirmed, grid]);

  useEffect(() => {
    if (grid && selectedIds) {
      saveSeatState({
        grid,
        selectedIds,
        lockedIds,
        personCount,
        remainingTime,
        lockStartTime,
        isConfirmed,
      });
    }
  }, [grid, selectedIds, lockedIds, personCount, remainingTime, lockStartTime, isConfirmed]);

  const handleTimeout = useCallback(() => {
    if (grid) {
      const result = releaseSelectedSeats(grid, selectedIds);
      setGrid(result.grid);
      setSelectedIds([]);
      setRemainingTime(LOCK_DURATION_SECONDS);
      setLockStartTime(null);
      clearSavedSeatState();
      showToast('选座超时，座位已释放，请重新选择', 'error');
    }
  }, [grid, selectedIds, showToast]);

  const handleSeatClick = useCallback(
    (row, col) => {
      if (!grid || isConfirmed) return;

      const seat = grid[row][col];
      if (!canSelectSeat(seat)) {
        return;
      }

      if (seat.status === SEAT_STATUS.SELECTED) {
        const result = toggleSeatSelection(grid, row, col, selectedIds);
        if (result.changed) {
          setGrid(result.grid);
          setSelectedIds(result.selected);
          if (result.selected.length === 0) {
            setRemainingTime(LOCK_DURATION_SECONDS);
            setLockStartTime(null);
          }
        }
        return;
      }

      if (personCount === PERSON_COUNT.SINGLE) {
        const result = toggleSeatSelection(grid, row, col, selectedIds);
        if (result.changed) {
          setGrid(result.grid);
          setSelectedIds(result.selected);
        }
      } else {
        const adjacent = findAdjacentSeats(grid, row, col, personCount);
        if (adjacent.length === personCount) {
          const result = selectMultipleSeats(grid, adjacent, selectedIds);
          if (result.changed) {
            setGrid(result.grid);
            setSelectedIds(result.selected);
          }
        } else {
          showToast('该位置周边没有足够的连续座位，请选择其他位置', 'error');
        }
      }
    },
    [grid, selectedIds, personCount, isConfirmed, showToast]
  );

  const handlePersonCountChangeClick = useCallback(
    (newCount) => {
      if (newCount === personCount) return;
      if (!grid) return;

      if (selectedIds.length > 0) {
        const result = handlePersonCountChange(grid, selectedIds, newCount);
        setGrid(result.grid);
        setSelectedIds(result.selected);
        setRemainingTime(result.remainingTime);
        setLockStartTime(null);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }

      setPersonCount(newCount);
    },
    [grid, selectedIds, personCount]
  );

  const handleConfirm = useCallback(() => {
    if (!grid || selectedIds.length === 0 || isConfirmed) return;

    const result = lockSelectedSeats(grid, selectedIds);
    if (result.success) {
      setGrid(result.grid);
      setLockedIds((prev) => [...new Set([...prev, ...selectedIds])]);
      setIsConfirmed(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      saveSeatState({
        grid: result.grid,
        selectedIds: [],
        lockedIds: [...new Set([...lockedIds, ...selectedIds])],
        personCount,
        remainingTime: LOCK_DURATION_SECONDS,
        lockStartTime: null,
        isConfirmed: true,
      });
      showToast('选座成功！', 'success');
    }
  }, [grid, selectedIds, isConfirmed, personCount, lockedIds, showToast]);

  const handleClearSelection = useCallback(() => {
    if (!grid || selectedIds.length === 0 || isConfirmed) return;
    const result = clearSelectedSeats(grid, selectedIds);
    if (result.changed) {
      setGrid(result.grid);
      setSelectedIds([]);
      setRemainingTime(LOCK_DURATION_SECONDS);
      setLockStartTime(null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [grid, selectedIds, isConfirmed]);

  const selectedSeats = useMemo(() => {
    if (!grid) return [];
    return getSeatsByIds(grid, selectedIds);
  }, [grid, selectedIds]);

  const totalPrice = useMemo(() => {
    return calculateTotalPrice(selectedSeats);
  }, [selectedSeats]);

  const seatGroups = useMemo(() => {
    return formatSeatGroups(selectedIds, personCount);
  }, [selectedIds, personCount]);

  const countdownStatus = useMemo(() => {
    return getCountdownStatus(remainingTime);
  }, [remainingTime]);

  const isZoneBoundary = (rowIdx) => {
    const zones = Object.values(ZONE_ROWS);
    for (let i = 1; i < zones.length; i++) {
      if (zones[i][0] === rowIdx) return true;
    }
    return false;
  };

  if (!grid) return null;

  return (
    <div className="seat-selection-page">
      <div className="seat-selection-container">
        {toast && (
          <div className={`toast ${toast.type}`}>{toast.message}</div>
        )}

        <div className="seat-selection-header">
          <div className="seat-selection-header-left">
            <button className="sudoku-back-btn" onClick={() => navigate('/')}>
              ← 返回首页
            </button>
            <h1 className="seat-selection-title">座位选座系统</h1>
          </div>
          <div className="person-count-selector">
            {Object.values(PERSON_COUNT).map((count) => (
              <button
                key={count}
                className={`person-count-btn ${personCount === count ? 'active' : ''}`}
                onClick={() => handlePersonCountChangeClick(count)}
                disabled={isConfirmed}
              >
                {PERSON_COUNT_LABELS[count]}
              </button>
            ))}
          </div>
        </div>

        <div className="seat-selection-main">
          <div className="seat-grid-section">
            <div className="price-legend">
              {Object.entries(PRICE_ZONE_CONFIG).map(([zone, config]) => (
                <div key={zone} className="price-legend-item">
                  <div
                    className="price-legend-color"
                    style={{
                      backgroundColor: config.color,
                      borderColor: config.borderColor,
                    }}
                  />
                  <span className="price-legend-label">{config.name}</span>
                  <span className="price-legend-price">¥{config.price}</span>
                </div>
              ))}
            </div>

            <div className="screen-indicator" />

            <div className="seat-grid-wrapper">
              <div className="column-labels">
                {Array.from({ length: TOTAL_COLS }, (_, i) => (
                  <div key={i} className="col-label">
                    {i + 1}
                  </div>
                ))}
              </div>

              <div className="seat-grid">
                {grid.map((row, rowIdx) => (
                  <div key={rowIdx} className="seat-row">
                    <div className="row-label">{getRowLabel(rowIdx)}</div>
                    {row.map((seat, colIdx) => {
                      const zoneConfig = PRICE_ZONE_CONFIG[seat.zone];
                      let cellClass = 'seat-cell';
                      cellClass += ` zone-${seat.zone}`;
                      if (seat.status === SEAT_STATUS.SELECTED) {
                        cellClass += ' selected';
                      } else if (seat.status === SEAT_STATUS.LOCKED) {
                        cellClass += ' locked';
                      } else if (seat.status === SEAT_STATUS.UNAVAILABLE) {
                        cellClass += ' unavailable';
                      }
                      if (isZoneBoundary(rowIdx)) {
                        cellClass += ' zone-boundary-top';
                      }

                      return (
                        <div
                          key={seat.id}
                          className={cellClass}
                          onClick={() => handleSeatClick(rowIdx, colIdx)}
                          style={{
                            backgroundColor:
                              seat.status === SEAT_STATUS.SELECTED
                                ? '#2563eb'
                                : seat.status === SEAT_STATUS.LOCKED
                                  ? '#ef4444'
                                  : seat.status === SEAT_STATUS.UNAVAILABLE
                                    ? '#374151'
                                    : zoneConfig.color,
                            borderColor:
                              seat.status === SEAT_STATUS.SELECTED
                                ? '#2563eb'
                                : seat.status === SEAT_STATUS.LOCKED
                                  ? '#ef4444'
                                  : seat.status === SEAT_STATUS.UNAVAILABLE
                                    ? '#374151'
                                    : zoneConfig.borderColor,
                          }}
                        >
                          <span className="seat-tooltip">{getSeatTooltip(seat)}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="seat-status-legend">
                <div className="status-item">
                  <div className="status-swatch available" />
                  <span>可选</span>
                </div>
                <div className="status-item">
                  <div className="status-swatch selected" />
                  <span>已选</span>
                </div>
                <div className="status-item">
                  <div className="status-swatch locked" />
                  <span>已锁定</span>
                </div>
                <div className="status-item">
                  <div className="status-swatch unavailable" />
                  <span>不可用</span>
                </div>
              </div>
            </div>
          </div>

          <div className="seat-sidebar">
            <div className="seat-summary">
              <h2 className="sidebar-title">已选座位</h2>

              {!isConfirmed && selectedIds.length > 0 && (
                <div className="countdown-display">
                  <div className="countdown-label">剩余锁定时间</div>
                  <div className={`countdown-timer ${countdownStatus}`}>
                    {formatCountdown(remainingTime)}
                  </div>
                </div>
              )}

              {isConfirmed && (
                <div className="success-message">
                  ✓ 选座成功，座位已锁定
                </div>
              )}

              <div className="selected-seats-list">
                {seatGroups.length === 0 ? (
                  <div className="empty-seats">请点击座位进行选择</div>
                ) : (
                  seatGroups.map((group) => (
                    <div
                      key={group.id}
                      className={`selected-seat-item ${group.isGroup ? 'group' : ''}`}
                    >
                      <div className="seat-info">
                        <span className="seat-id">
                          {group.isGroup
                            ? `(${group.seats.join(', ')})`
                            : group.seats[0]}
                        </span>
                        <span className="seat-zone">
                          {group.isGroup
                            ? `${group.seats.length}个座位`
                            : PRICE_ZONE_CONFIG[
                                getSeatsByIds(grid, [group.seats[0]])[0]?.zone
                              ]?.name}
                        </span>
                      </div>
                      <span className="seat-price">
                        ¥
                        {calculateTotalPrice(getSeatsByIds(grid, group.seats))}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="summary-total">
                <div className="summary-count">共 {selectedSeats.length} 个座位</div>
                <div className="summary-price">
                  合计 <span className="summary-price-value">¥{totalPrice}</span>
                </div>
              </div>

              {!isConfirmed ? (
                <>
                  <button
                    className="confirm-btn"
                    onClick={handleConfirm}
                    disabled={selectedIds.length === 0 || isTimeout(remainingTime)}
                  >
                    确认选座
                  </button>
                  {selectedIds.length > 0 && (
                    <button
                      className="confirm-btn"
                      onClick={handleClearSelection}
                      style={{
                        marginTop: '12px',
                        background: '#6b7280',
                      }}
                    >
                      清空选择
                    </button>
                  )}
                </>
              ) : (
                <button className="confirm-btn confirmed" disabled>
                  已确认
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SeatSelectionPage;
