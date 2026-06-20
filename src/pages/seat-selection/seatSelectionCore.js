import {
  SEAT_STATUS,
  PRICE_ZONES,
  PRICE_ZONE_CONFIG,
  TOTAL_ROWS,
  TOTAL_COLS,
  ZONE_ROWS,
  UNAVAILABLE_SEATS,
  LOCK_DURATION_SECONDS,
  WARNING_THRESHOLD,
  DANGER_THRESHOLD,
  STORAGE_KEY,
  PERSON_COUNT,
} from './constants.js';

export function getRowLabel(rowIndex) {
  return String.fromCharCode(65 + rowIndex);
}

export function getSeatId(row, col) {
  return `${getRowLabel(row)}${col + 1}`;
}

export function parseSeatId(seatId) {
  const match = seatId.match(/^([A-Z])(\d+)$/);
  if (!match) return null;
  return {
    row: match[1].charCodeAt(0) - 65,
    col: parseInt(match[2], 10) - 1,
  };
}

export function getPriceZone(rowIndex) {
  for (const [zone, rows] of Object.entries(ZONE_ROWS)) {
    if (rows.includes(rowIndex)) {
      return zone;
    }
  }
  return PRICE_ZONES.ECONOMY;
}

export function isUnavailable(row, col) {
  return UNAVAILABLE_SEATS.some((s) => s.row === row && s.col === col);
}

export function createSeatGrid() {
  const grid = [];
  for (let row = 0; row < TOTAL_ROWS; row++) {
    const rowSeats = [];
    for (let col = 0; col < TOTAL_COLS; col++) {
      const zone = getPriceZone(row);
      const unavailable = isUnavailable(row, col);
      rowSeats.push({
        row,
        col,
        id: getSeatId(row, col),
        status: unavailable ? SEAT_STATUS.UNAVAILABLE : SEAT_STATUS.AVAILABLE,
        zone,
        price: PRICE_ZONE_CONFIG[zone].price,
      });
    }
    grid.push(rowSeats);
  }
  return grid;
}

export function findAdjacentSeats(grid, row, col, count) {
  const rowSeats = grid[row];
  if (!rowSeats || count <= 0) return [];

  const canSelect = (seat) =>
    seat &&
    seat.status !== SEAT_STATUS.LOCKED &&
    seat.status !== SEAT_STATUS.UNAVAILABLE;

  const findLeftRight = (startCol) => {
    const seats = [];
    for (let i = 0; i < count; i++) {
      const seat = rowSeats[startCol + i];
      if (!canSelect(seat)) return null;
      seats.push(seat);
    }
    return seats;
  };

  const offsets = [];
  for (let offset = 0; offset < count; offset++) {
    const startCol = col - offset;
    if (startCol >= 0 && startCol + count <= TOTAL_COLS) {
      offsets.push(offset);
    }
  }

  const preferredOffset = Math.floor(count / 2);
  offsets.sort((a, b) => {
    const aContains = col - a <= col && col - a + count > col;
    const bContains = col - b <= col && col - b + count > col;
    if (aContains && !bContains) return -1;
    if (!aContains && bContains) return 1;
    return Math.abs(a - preferredOffset) - Math.abs(b - preferredOffset);
  });

  for (const offset of offsets) {
    const startCol = col - offset;
    const seats = findLeftRight(startCol);
    if (seats) return seats;
  }

  return [];
}

export function canSelectAdjacentSeats(grid, row, col, count) {
  const adjacent = findAdjacentSeats(grid, row, col, count);
  return adjacent.length === count;
}

export function calculateTotalPrice(selectedSeats) {
  if (!Array.isArray(selectedSeats)) return 0;
  return selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
}

export function formatCountdown(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(safeSeconds / 60);
  const s = safeSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getCountdownStatus(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  if (safeSeconds <= DANGER_THRESHOLD) return 'danger';
  if (safeSeconds <= WARNING_THRESHOLD) return 'warning';
  return 'normal';
}

export function isTimeout(seconds) {
  return Math.max(0, Number(seconds) || 0) <= 0;
}

export function canSelectSeat(seat) {
  if (!seat) return false;
  return (
    seat.status === SEAT_STATUS.AVAILABLE || seat.status === SEAT_STATUS.SELECTED
  );
}

export function toggleSeatSelection(grid, row, col, selectedIds) {
  const seat = grid[row]?.[col];
  if (!seat || !canSelectSeat(seat)) {
    return { grid, selected: selectedIds, changed: false };
  }

  const id = seat.id;
  const isSelected = selectedIds.includes(id);

  const newGrid = grid.map((r) =>
    r.map((s) => {
      if (s.id !== id) return s;
      return {
        ...s,
        status: isSelected ? SEAT_STATUS.AVAILABLE : SEAT_STATUS.SELECTED,
      };
    })
  );

  const newSelected = isSelected
    ? selectedIds.filter((sid) => sid !== id)
    : [...selectedIds, id];

  return { grid: newGrid, selected: newSelected, changed: true };
}

export function selectMultipleSeats(grid, seats, selectedIds) {
  if (!Array.isArray(seats) || seats.length === 0) {
    return { grid, selected: selectedIds, changed: false };
  }

  const idsToSelect = seats.map((s) => s.id);
  const newSelected = [...new Set([...selectedIds, ...idsToSelect])];

  const newGrid = grid.map((row) =>
    row.map((seat) => {
      if (idsToSelect.includes(seat.id) && canSelectSeat(seat)) {
        return { ...seat, status: SEAT_STATUS.SELECTED };
      }
      return seat;
    })
  );

  return { grid: newGrid, selected: newSelected, changed: true };
}

export function clearSelectedSeats(grid, selectedIds) {
  if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
    return { grid, selected: [], changed: false };
  }

  const newGrid = grid.map((row) =>
    row.map((seat) => {
      if (selectedIds.includes(seat.id) && seat.status === SEAT_STATUS.SELECTED) {
        return { ...seat, status: SEAT_STATUS.AVAILABLE };
      }
      return seat;
    })
  );

  return { grid: newGrid, selected: [], changed: true };
}

export function lockSelectedSeats(grid, selectedIds) {
  if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
    return { grid, success: false };
  }

  const newGrid = grid.map((row) =>
    row.map((seat) => {
      if (selectedIds.includes(seat.id) && seat.status === SEAT_STATUS.SELECTED) {
        return { ...seat, status: SEAT_STATUS.LOCKED };
      }
      return seat;
    })
  );

  return { grid: newGrid, success: true };
}

export function releaseSelectedSeats(grid, selectedIds) {
  if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
    return { grid, released: [] };
  }

  const released = [];
  const newGrid = grid.map((row) =>
    row.map((seat) => {
      if (selectedIds.includes(seat.id) && seat.status === SEAT_STATUS.SELECTED) {
        released.push(seat.id);
        return { ...seat, status: SEAT_STATUS.AVAILABLE };
      }
      return seat;
    })
  );

  return { grid: newGrid, released };
}

export function getSeatsByIds(grid, ids) {
  if (!Array.isArray(ids)) return [];
  const result = [];
  for (const row of grid) {
    for (const seat of row) {
      if (ids.includes(seat.id)) {
        result.push(seat);
      }
    }
  }
  return result;
}

export function formatSeatGroups(selectedIds, personCount) {
  if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
    return [];
  }

  if (personCount === PERSON_COUNT.SINGLE || selectedIds.length === 1) {
    return selectedIds.map((id) => ({ id, isGroup: false, seats: [id] }));
  }

  const groups = [];
  const remaining = [...selectedIds];

  while (remaining.length > 0) {
    if (remaining.length >= personCount) {
      const group = remaining.splice(0, personCount);
      groups.push({ id: `group-${groups.length}`, isGroup: true, seats: group });
    } else if (remaining.length > 1) {
      const group = remaining.splice(0, remaining.length);
      groups.push({ id: `group-${groups.length}`, isGroup: true, seats: group });
    } else {
      const single = remaining.shift();
      groups.push({ id: single, isGroup: false, seats: [single] });
    }
  }

  return groups;
}

export function getSeatTooltip(seat) {
  if (!seat) return '';
  const zoneConfig = PRICE_ZONE_CONFIG[seat.zone];
  return `${seat.id} · ${zoneConfig.name} · ¥${seat.price}`;
}

export function updatePriceZoneConfig(grid, zone, newConfig, currentConfig) {
  const config = currentConfig || PRICE_ZONE_CONFIG;
  const upperKey = zone.toUpperCase?.();
  if (!PRICE_ZONES[upperKey]) return { grid, priceZoneConfig: config };
  const zoneKey = PRICE_ZONES[upperKey];

  const mergedConfig = { ...config[zoneKey], ...newConfig };
  const updatedConfig = { ...config, [zoneKey]: mergedConfig };

  const rows = ZONE_ROWS[zoneKey] || [];
  const newGrid = grid.map((row, rowIdx) => {
    if (!rows.includes(rowIdx)) return row;
    return row.map((seat) => ({
      ...seat,
      price: mergedConfig.price,
    }));
  });

  return { grid: newGrid, priceZoneConfig: updatedConfig };
}

export function saveSeatState(state, storage) {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!s) return;
    const data = {
      grid: state.grid,
      selectedIds: state.selectedIds,
      lockedIds: state.lockedIds || [],
      personCount: state.personCount,
      remainingTime: state.remainingTime,
      lockStartTime: state.lockStartTime,
      isConfirmed: state.isConfirmed,
      priceZoneConfig: state.priceZoneConfig || PRICE_ZONE_CONFIG,
      zoneRows: state.zoneRows || ZONE_ROWS,
      savedAt: Date.now(),
    };
    s.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}

export function loadSeatState(storage) {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!s) return null;
    const raw = s.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);

    if (data.savedAt && data.remainingTime && !data.isConfirmed) {
      const elapsed = Math.floor((Date.now() - data.savedAt) / 1000);
      data.remainingTime = Math.max(0, data.remainingTime - elapsed);
      if (data.remainingTime <= 0) {
        return null;
      }
    }

    return {
      grid: data.grid,
      selectedIds: data.selectedIds || [],
      lockedIds: data.lockedIds || [],
      personCount: data.personCount || PERSON_COUNT.SINGLE,
      remainingTime: data.remainingTime || LOCK_DURATION_SECONDS,
      lockStartTime: data.lockStartTime,
      isConfirmed: data.isConfirmed || false,
      priceZoneConfig: data.priceZoneConfig,
      zoneRows: data.zoneRows,
    };
  } catch {
    return null;
  }
}

export function clearSavedSeatState(storage) {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (s) s.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function restoreLockedSeats(grid, lockedIds) {
  if (!Array.isArray(lockedIds) || lockedIds.length === 0) return grid;

  return grid.map((row) =>
    row.map((seat) => {
      if (lockedIds.includes(seat.id)) {
        return { ...seat, status: SEAT_STATUS.LOCKED };
      }
      return seat;
    })
  );
}

export function handlePersonCountChange(grid, selectedIds) {
  const result = clearSelectedSeats(grid, selectedIds);
  return {
    grid: result.grid,
    selected: [],
    remainingTime: LOCK_DURATION_SECONDS,
  };
}

export function handleMultiPersonSeatClick(grid, row, col, personCount, selectedIds) {
  const seat = grid[row]?.[col];
  if (!seat || !canSelectSeat(seat)) {
    return { grid, selected: selectedIds, changed: false, needsFallback: false };
  }

  if (seat.status === SEAT_STATUS.SELECTED) {
    const result = toggleSeatSelection(grid, row, col, selectedIds);
    return { grid: result.grid, selected: result.selected, changed: result.changed, needsFallback: false };
  }

  const adjacent = findAdjacentSeats(grid, row, col, personCount);
  if (adjacent.length === personCount) {
    const result = selectMultipleSeats(grid, adjacent, selectedIds);
    return { grid: result.grid, selected: result.selected, changed: result.changed, needsFallback: false };
  }

  return { grid, selected: selectedIds, changed: false, needsFallback: true };
}
