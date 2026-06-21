import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getRowLabel,
  getSeatId,
  parseSeatId,
  getPriceZone,
  isUnavailable,
  createSeatGrid,
  findAdjacentSeats,
  canSelectAdjacentSeats,
  calculateTotalPrice,
  formatCountdown,
  getCountdownStatus,
  isTimeout,
  canSelectSeat,
  toggleSeatSelection,
  selectMultipleSeats,
  clearSelectedSeats,
  lockSelectedSeats,
  releaseSelectedSeats,
  getSeatsByIds,
  formatSeatGroups,
  getSeatTooltip,
  updatePriceZoneConfig,
  saveSeatState,
  loadSeatState,
  clearSavedSeatState,
  restoreLockedSeats,
  handlePersonCountChange,
  handleMultiPersonSeatClick,
  canAddSeat,
  handleManualSeatClick,
  mergeLockedIds,
} from '@/pages/seat-selection/seatSelectionCore.js';
import {
  SEAT_STATUS,
  PRICE_ZONES,
  PRICE_ZONE_CONFIG,
  PERSON_COUNT,
  LOCK_DURATION_SECONDS,
  WARNING_THRESHOLD,
  DANGER_THRESHOLD,
  TOTAL_ROWS,
  TOTAL_COLS,
  STORAGE_KEY,
} from '@/pages/seat-selection/constants.js';

function createMockStorage() {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    _store: store,
  };
}

describe('seatSelectionCore', () => {
  describe('getRowLabel', () => {
    it('should return A for index 0', () => {
      expect(getRowLabel(0)).toBe('A');
    });

    it('should return B for index 1', () => {
      expect(getRowLabel(1)).toBe('B');
    });

    it('should return J for index 9', () => {
      expect(getRowLabel(9)).toBe('J');
    });
  });

  describe('getSeatId', () => {
    it('should return A1 for row 0, col 0', () => {
      expect(getSeatId(0, 0)).toBe('A1');
    });

    it('should return B5 for row 1, col 4', () => {
      expect(getSeatId(1, 4)).toBe('B5');
    });

    it('should return J15 for row 9, col 14', () => {
      expect(getSeatId(9, 14)).toBe('J15');
    });
  });

  describe('parseSeatId', () => {
    it('should parse A1 correctly', () => {
      expect(parseSeatId('A1')).toEqual({ row: 0, col: 0 });
    });

    it('should parse B5 correctly', () => {
      expect(parseSeatId('B5')).toEqual({ row: 1, col: 4 });
    });

    it('should parse J15 correctly', () => {
      expect(parseSeatId('J15')).toEqual({ row: 9, col: 14 });
    });

    it('should return null for invalid format', () => {
      expect(parseSeatId('invalid')).toBeNull();
      expect(parseSeatId('1A')).toBeNull();
      expect(parseSeatId('')).toBeNull();
    });
  });

  describe('getPriceZone', () => {
    it('should return VIP for rows 0-2', () => {
      expect(getPriceZone(0)).toBe(PRICE_ZONES.VIP);
      expect(getPriceZone(1)).toBe(PRICE_ZONES.VIP);
      expect(getPriceZone(2)).toBe(PRICE_ZONES.VIP);
    });

    it('should return STANDARD for rows 3-6', () => {
      expect(getPriceZone(3)).toBe(PRICE_ZONES.STANDARD);
      expect(getPriceZone(4)).toBe(PRICE_ZONES.STANDARD);
      expect(getPriceZone(5)).toBe(PRICE_ZONES.STANDARD);
      expect(getPriceZone(6)).toBe(PRICE_ZONES.STANDARD);
    });

    it('should return ECONOMY for rows 7-9', () => {
      expect(getPriceZone(7)).toBe(PRICE_ZONES.ECONOMY);
      expect(getPriceZone(8)).toBe(PRICE_ZONES.ECONOMY);
      expect(getPriceZone(9)).toBe(PRICE_ZONES.ECONOMY);
    });
  });

  describe('isUnavailable', () => {
    it('should return true for unavailable seats', () => {
      expect(isUnavailable(0, 7)).toBe(true);
      expect(isUnavailable(1, 7)).toBe(true);
      expect(isUnavailable(2, 7)).toBe(true);
    });

    it('should return false for available seats', () => {
      expect(isUnavailable(0, 0)).toBe(false);
      expect(isUnavailable(5, 5)).toBe(false);
      expect(isUnavailable(9, 14)).toBe(false);
    });
  });

  describe('createSeatGrid', () => {
    it('should create a grid with correct dimensions', () => {
      const grid = createSeatGrid();
      expect(grid.length).toBe(TOTAL_ROWS);
      grid.forEach((row) => expect(row.length).toBe(TOTAL_COLS));
    });

    it('should have correct seat properties', () => {
      const grid = createSeatGrid();
      const seat = grid[0][0];
      expect(seat).toHaveProperty('row', 0);
      expect(seat).toHaveProperty('col', 0);
      expect(seat).toHaveProperty('id', 'A1');
      expect(seat).toHaveProperty('status');
      expect(seat).toHaveProperty('zone');
      expect(seat).toHaveProperty('price');
    });

    it('should mark unavailable seats correctly', () => {
      const grid = createSeatGrid();
      expect(grid[0][7].status).toBe(SEAT_STATUS.UNAVAILABLE);
      expect(grid[1][7].status).toBe(SEAT_STATUS.UNAVAILABLE);
      expect(grid[2][7].status).toBe(SEAT_STATUS.UNAVAILABLE);
    });

    it('should set correct prices based on zone', () => {
      const grid = createSeatGrid();
      expect(grid[0][0].price).toBe(PRICE_ZONE_CONFIG[PRICE_ZONES.VIP].price);
      expect(grid[4][0].price).toBe(PRICE_ZONE_CONFIG[PRICE_ZONES.STANDARD].price);
      expect(grid[8][0].price).toBe(PRICE_ZONE_CONFIG[PRICE_ZONES.ECONOMY].price);
    });
  });

  describe('findAdjacentSeats', () => {
    it('should find 2 adjacent seats to the right', () => {
      const grid = createSeatGrid();
      const result = findAdjacentSeats(grid, 0, 0, 2);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('A1');
      expect(result[1].id).toBe('A2');
    });

    it('should find 2 adjacent seats including left', () => {
      const grid = createSeatGrid();
      const result = findAdjacentSeats(grid, 0, 5, 2);
      expect(result.length).toBe(2);
      expect(result.map((s) => s.id)).toContain('A5');
      expect(result.map((s) => s.id)).toContain('A6');
    });

    it('should find 3 adjacent seats', () => {
      const grid = createSeatGrid();
      const result = findAdjacentSeats(grid, 0, 5, 3);
      expect(result.length).toBe(3);
      expect(result[0].id).toBe('A5');
      expect(result[1].id).toBe('A6');
      expect(result[2].id).toBe('A7');
    });

    it('should return empty array when not enough seats at the end', () => {
      const grid = createSeatGrid();
      grid[0][11].status = SEAT_STATUS.LOCKED;
      grid[0][12].status = SEAT_STATUS.LOCKED;
      const result = findAdjacentSeats(grid, 0, 14, 4);
      expect(result.length).toBe(0);
    });

    it('should skip locked seats', () => {
      const grid = createSeatGrid();
      grid[0][1].status = SEAT_STATUS.LOCKED;
      const result = findAdjacentSeats(grid, 0, 0, 2);
      expect(result.length).toBe(0);
    });

    it('should skip unavailable seats', () => {
      const grid = createSeatGrid();
      grid[0][1].status = SEAT_STATUS.UNAVAILABLE;
      const result = findAdjacentSeats(grid, 0, 0, 2);
      expect(result.length).toBe(0);
    });

    it('should return empty array for invalid count', () => {
      const grid = createSeatGrid();
      expect(findAdjacentSeats(grid, 0, 0, 0).length).toBe(0);
      expect(findAdjacentSeats(grid, 0, 0, -1).length).toBe(0);
    });
  });

  describe('canSelectAdjacentSeats', () => {
    it('should return true when enough adjacent seats exist', () => {
      const grid = createSeatGrid();
      expect(canSelectAdjacentSeats(grid, 0, 0, 2)).toBe(true);
      expect(canSelectAdjacentSeats(grid, 0, 5, 3)).toBe(true);
    });

    it('should return false when not enough adjacent seats exist', () => {
      const grid = createSeatGrid();
      grid[0][11].status = SEAT_STATUS.LOCKED;
      grid[0][12].status = SEAT_STATUS.LOCKED;
      expect(canSelectAdjacentSeats(grid, 0, 14, 4)).toBe(false);
    });
  });

  describe('calculateTotalPrice', () => {
    it('should return 0 for empty array', () => {
      expect(calculateTotalPrice([])).toBe(0);
    });

    it('should return 0 for non-array input', () => {
      expect(calculateTotalPrice(null)).toBe(0);
      expect(calculateTotalPrice(undefined)).toBe(0);
      expect(calculateTotalPrice('invalid')).toBe(0);
    });

    it('should sum prices correctly', () => {
      const seats = [
        { price: 120 },
        { price: 80 },
        { price: 50 },
      ];
      expect(calculateTotalPrice(seats)).toBe(250);
    });

    it('should handle seats without price property', () => {
      const seats = [
        { price: 120 },
        {},
        { price: 80 },
      ];
      expect(calculateTotalPrice(seats)).toBe(200);
    });
  });

  describe('formatCountdown', () => {
    it('should format 0 seconds as 00:00', () => {
      expect(formatCountdown(0)).toBe('00:00');
    });

    it('should format seconds less than 60 correctly', () => {
      expect(formatCountdown(45)).toBe('00:45');
      expect(formatCountdown(9)).toBe('00:09');
    });

    it('should format minutes and seconds correctly', () => {
      expect(formatCountdown(125)).toBe('02:05');
      expect(formatCountdown(60)).toBe('01:00');
      expect(formatCountdown(900)).toBe('15:00');
    });

    it('should handle negative values', () => {
      expect(formatCountdown(-10)).toBe('00:00');
    });

    it('should handle non-numeric values', () => {
      expect(formatCountdown('invalid')).toBe('00:00');
      expect(formatCountdown(null)).toBe('00:00');
      expect(formatCountdown(undefined)).toBe('00:00');
    });
  });

  describe('getCountdownStatus', () => {
    it('should return normal for values above warning threshold', () => {
      expect(getCountdownStatus(WARNING_THRESHOLD + 1)).toBe('normal');
      expect(getCountdownStatus(LOCK_DURATION_SECONDS)).toBe('normal');
    });

    it('should return warning for values between danger and warning thresholds', () => {
      expect(getCountdownStatus(WARNING_THRESHOLD)).toBe('warning');
      expect(getCountdownStatus(DANGER_THRESHOLD + 1)).toBe('warning');
    });

    it('should return danger for values at or below danger threshold', () => {
      expect(getCountdownStatus(DANGER_THRESHOLD)).toBe('danger');
      expect(getCountdownStatus(0)).toBe('danger');
      expect(getCountdownStatus(-10)).toBe('danger');
    });
  });

  describe('isTimeout', () => {
    it('should return true for 0 seconds', () => {
      expect(isTimeout(0)).toBe(true);
    });

    it('should return true for negative seconds', () => {
      expect(isTimeout(-1)).toBe(true);
      expect(isTimeout(-100)).toBe(true);
    });

    it('should return false for positive seconds', () => {
      expect(isTimeout(1)).toBe(false);
      expect(isTimeout(LOCK_DURATION_SECONDS)).toBe(false);
    });

    it('should handle non-numeric values', () => {
      expect(isTimeout(null)).toBe(true);
      expect(isTimeout(undefined)).toBe(true);
      expect(isTimeout('invalid')).toBe(true);
    });
  });

  describe('canSelectSeat', () => {
    it('should return true for available seat', () => {
      const seat = { status: SEAT_STATUS.AVAILABLE };
      expect(canSelectSeat(seat)).toBe(true);
    });

    it('should return true for selected seat', () => {
      const seat = { status: SEAT_STATUS.SELECTED };
      expect(canSelectSeat(seat)).toBe(true);
    });

    it('should return false for locked seat', () => {
      const seat = { status: SEAT_STATUS.LOCKED };
      expect(canSelectSeat(seat)).toBe(false);
    });

    it('should return false for unavailable seat', () => {
      const seat = { status: SEAT_STATUS.UNAVAILABLE };
      expect(canSelectSeat(seat)).toBe(false);
    });

    it('should return false for null/undefined seat', () => {
      expect(canSelectSeat(null)).toBe(false);
      expect(canSelectSeat(undefined)).toBe(false);
    });
  });

  describe('toggleSeatSelection', () => {
    it('should select an available seat', () => {
      const grid = createSeatGrid();
      const result = toggleSeatSelection(grid, 0, 0, []);
      expect(result.changed).toBe(true);
      expect(result.grid[0][0].status).toBe(SEAT_STATUS.SELECTED);
      expect(result.selected).toContain('A1');
    });

    it('should deselect a selected seat', () => {
      const grid = createSeatGrid();
      grid[0][0].status = SEAT_STATUS.SELECTED;
      const result = toggleSeatSelection(grid, 0, 0, ['A1']);
      expect(result.changed).toBe(true);
      expect(result.grid[0][0].status).toBe(SEAT_STATUS.AVAILABLE);
      expect(result.selected).not.toContain('A1');
    });

    it('should not change locked seat', () => {
      const grid = createSeatGrid();
      grid[0][0].status = SEAT_STATUS.LOCKED;
      const result = toggleSeatSelection(grid, 0, 0, []);
      expect(result.changed).toBe(false);
      expect(result.grid[0][0].status).toBe(SEAT_STATUS.LOCKED);
    });

    it('should not mutate original grid', () => {
      const grid = createSeatGrid();
      const originalStatus = grid[0][0].status;
      toggleSeatSelection(grid, 0, 0, []);
      expect(grid[0][0].status).toBe(originalStatus);
    });
  });

  describe('selectMultipleSeats', () => {
    it('should select multiple seats', () => {
      const grid = createSeatGrid();
      const seats = [grid[0][0], grid[0][1], grid[0][2]];
      const result = selectMultipleSeats(grid, seats, []);
      expect(result.changed).toBe(true);
      expect(result.grid[0][0].status).toBe(SEAT_STATUS.SELECTED);
      expect(result.grid[0][1].status).toBe(SEAT_STATUS.SELECTED);
      expect(result.grid[0][2].status).toBe(SEAT_STATUS.SELECTED);
      expect(result.selected).toEqual(expect.arrayContaining(['A1', 'A2', 'A3']));
    });

    it('should not change when seats array is empty', () => {
      const grid = createSeatGrid();
      const result = selectMultipleSeats(grid, [], []);
      expect(result.changed).toBe(false);
    });

    it('should not mutate original grid', () => {
      const grid = createSeatGrid();
      const seats = [grid[0][0]];
      const originalStatus = grid[0][0].status;
      selectMultipleSeats(grid, seats, []);
      expect(grid[0][0].status).toBe(originalStatus);
    });

    it('should avoid duplicate selected IDs', () => {
      const grid = createSeatGrid();
      const seats = [grid[0][0]];
      const result = selectMultipleSeats(grid, seats, ['A1']);
      expect(result.selected.filter((id) => id === 'A1').length).toBe(1);
    });
  });

  describe('clearSelectedSeats', () => {
    it('should clear all selected seats', () => {
      const grid = createSeatGrid();
      grid[0][0].status = SEAT_STATUS.SELECTED;
      grid[0][1].status = SEAT_STATUS.SELECTED;
      const result = clearSelectedSeats(grid, ['A1', 'A2']);
      expect(result.changed).toBe(true);
      expect(result.grid[0][0].status).toBe(SEAT_STATUS.AVAILABLE);
      expect(result.grid[0][1].status).toBe(SEAT_STATUS.AVAILABLE);
      expect(result.selected).toEqual([]);
    });

    it('should not change when no seats are selected', () => {
      const grid = createSeatGrid();
      const result = clearSelectedSeats(grid, []);
      expect(result.changed).toBe(false);
    });

    it('should not affect locked seats', () => {
      const grid = createSeatGrid();
      grid[0][0].status = SEAT_STATUS.SELECTED;
      grid[0][1].status = SEAT_STATUS.LOCKED;
      const result = clearSelectedSeats(grid, ['A1', 'A2']);
      expect(result.grid[0][0].status).toBe(SEAT_STATUS.AVAILABLE);
      expect(result.grid[0][1].status).toBe(SEAT_STATUS.LOCKED);
    });
  });

  describe('lockSelectedSeats', () => {
    it('should lock selected seats', () => {
      const grid = createSeatGrid();
      grid[0][0].status = SEAT_STATUS.SELECTED;
      grid[0][1].status = SEAT_STATUS.SELECTED;
      const result = lockSelectedSeats(grid, ['A1', 'A2']);
      expect(result.success).toBe(true);
      expect(result.grid[0][0].status).toBe(SEAT_STATUS.LOCKED);
      expect(result.grid[0][1].status).toBe(SEAT_STATUS.LOCKED);
    });

    it('should return success false when no seats to lock', () => {
      const grid = createSeatGrid();
      const result = lockSelectedSeats(grid, []);
      expect(result.success).toBe(false);
    });

    it('should not mutate original grid', () => {
      const grid = createSeatGrid();
      grid[0][0].status = SEAT_STATUS.SELECTED;
      lockSelectedSeats(grid, ['A1']);
      expect(grid[0][0].status).toBe(SEAT_STATUS.SELECTED);
    });
  });

  describe('releaseSelectedSeats', () => {
    it('should release selected seats to available', () => {
      const grid = createSeatGrid();
      grid[0][0].status = SEAT_STATUS.SELECTED;
      grid[0][1].status = SEAT_STATUS.SELECTED;
      const result = releaseSelectedSeats(grid, ['A1', 'A2']);
      expect(result.grid[0][0].status).toBe(SEAT_STATUS.AVAILABLE);
      expect(result.grid[0][1].status).toBe(SEAT_STATUS.AVAILABLE);
      expect(result.released).toEqual(['A1', 'A2']);
    });

    it('should return empty released array when no seats selected', () => {
      const grid = createSeatGrid();
      const result = releaseSelectedSeats(grid, []);
      expect(result.released).toEqual([]);
    });

    it('should not affect locked seats', () => {
      const grid = createSeatGrid();
      grid[0][0].status = SEAT_STATUS.LOCKED;
      const result = releaseSelectedSeats(grid, ['A1']);
      expect(result.grid[0][0].status).toBe(SEAT_STATUS.LOCKED);
      expect(result.released).toEqual([]);
    });
  });

  describe('getSeatsByIds', () => {
    it('should return seats matching given IDs', () => {
      const grid = createSeatGrid();
      const seats = getSeatsByIds(grid, ['A1', 'B5', 'C3']);
      expect(seats.length).toBe(3);
      expect(seats.map((s) => s.id)).toContain('A1');
      expect(seats.map((s) => s.id)).toContain('B5');
      expect(seats.map((s) => s.id)).toContain('C3');
    });

    it('should return empty array for empty input', () => {
      const grid = createSeatGrid();
      expect(getSeatsByIds(grid, []).length).toBe(0);
    });

    it('should handle non-array input', () => {
      const grid = createSeatGrid();
      expect(getSeatsByIds(grid, null).length).toBe(0);
    });

    it('should ignore non-existent seat IDs', () => {
      const grid = createSeatGrid();
      const seats = getSeatsByIds(grid, ['A1', 'Z99', 'B5']);
      expect(seats.length).toBe(2);
    });
  });

  describe('formatSeatGroups', () => {
    it('should return empty array for empty input', () => {
      expect(formatSeatGroups([], PERSON_COUNT.SINGLE)).toEqual([]);
    });

    it('should return individual items for single person mode', () => {
      const result = formatSeatGroups(['A1', 'A2', 'A3'], PERSON_COUNT.SINGLE);
      expect(result.length).toBe(3);
      expect(result.every((g) => g.isGroup === false)).toBe(true);
    });

    it('should group seats for double mode', () => {
      const result = formatSeatGroups(['A1', 'A2', 'A3'], PERSON_COUNT.DOUBLE);
      expect(result.length).toBe(2);
      expect(result[0].isGroup).toBe(true);
      expect(result[0].seats).toEqual(['A1', 'A2']);
      expect(result[1].isGroup).toBe(false);
      expect(result[1].seats).toEqual(['A3']);
    });

    it('should group seats for triple mode', () => {
      const result = formatSeatGroups(
        ['A1', 'A2', 'A3', 'A4', 'A5'],
        PERSON_COUNT.TRIPLE
      );
      expect(result.length).toBe(2);
      expect(result[0].isGroup).toBe(true);
      expect(result[0].seats).toEqual(['A1', 'A2', 'A3']);
      expect(result[1].isGroup).toBe(true);
      expect(result[1].seats).toEqual(['A4', 'A5']);
    });
  });

  describe('getSeatTooltip', () => {
    it('should return correct tooltip format', () => {
      const seat = {
        id: 'A1',
        zone: PRICE_ZONES.VIP,
        price: 120,
      };
      const tooltip = getSeatTooltip(seat);
      expect(tooltip).toContain('A1');
      expect(tooltip).toContain('VIP区');
      expect(tooltip).toContain('¥120');
    });

    it('should return empty string for null seat', () => {
      expect(getSeatTooltip(null)).toBe('');
      expect(getSeatTooltip(undefined)).toBe('');
    });
  });

  describe('restoreLockedSeats', () => {
    it('should restore locked seats status', () => {
      const grid = createSeatGrid();
      const result = restoreLockedSeats(grid, ['A1', 'B5']);
      expect(result[0][0].status).toBe(SEAT_STATUS.LOCKED);
      expect(result[1][4].status).toBe(SEAT_STATUS.LOCKED);
    });

    it('should return original grid when no locked IDs', () => {
      const grid = createSeatGrid();
      const result = restoreLockedSeats(grid, []);
      expect(result).toBe(grid);
    });

    it('should not mutate original grid', () => {
      const grid = createSeatGrid();
      const originalStatus = grid[0][0].status;
      restoreLockedSeats(grid, ['A1']);
      expect(grid[0][0].status).toBe(originalStatus);
    });
  });

  describe('handlePersonCountChange', () => {
    it('should clear selected seats and reset timer', () => {
      const grid = createSeatGrid();
      grid[0][0].status = SEAT_STATUS.SELECTED;
      const result = handlePersonCountChange(grid, ['A1']);
      expect(result.grid[0][0].status).toBe(SEAT_STATUS.AVAILABLE);
      expect(result.selected).toEqual([]);
      expect(result.remainingTime).toBe(LOCK_DURATION_SECONDS);
    });
  });

  describe('localStorage persistence', () => {
    let storage;

    beforeEach(() => {
      storage = createMockStorage();
    });

    afterEach(() => {
      clearSavedSeatState(storage);
    });

    it('loadSeatState should return null when no saved state', () => {
      expect(loadSeatState(storage)).toBeNull();
    });

    it('saveSeatState and loadSeatState should round-trip', () => {
      const grid = createSeatGrid();
      const state = {
        grid,
        selectedIds: ['A1', 'A2'],
        lockedIds: ['B5'],
        personCount: PERSON_COUNT.DOUBLE,
        remainingTime: 800,
        lockStartTime: Date.now(),
        isConfirmed: false,
      };
      saveSeatState(state, storage);
      const loaded = loadSeatState(storage);
      expect(loaded).not.toBeNull();
      expect(loaded.selectedIds).toEqual(['A1', 'A2']);
      expect(loaded.lockedIds).toEqual(['B5']);
      expect(loaded.personCount).toBe(PERSON_COUNT.DOUBLE);
      expect(loaded.isConfirmed).toBe(false);
    });

    it('clearSavedSeatState should remove saved data', () => {
      const state = {
        grid: createSeatGrid(),
        selectedIds: ['A1'],
        personCount: PERSON_COUNT.SINGLE,
        remainingTime: 900,
        isConfirmed: false,
      };
      saveSeatState(state, storage);
      clearSavedSeatState(storage);
      expect(loadSeatState(storage)).toBeNull();
    });

    it('loadSeatState should return null for invalid JSON', () => {
      storage.setItem(STORAGE_KEY, 'not-json');
      expect(loadSeatState(storage)).toBeNull();
    });

    it('should not throw when storage is null', () => {
      expect(() => saveSeatState({}, null)).not.toThrow();
      expect(() => loadSeatState(null)).not.toThrow();
      expect(() => clearSavedSeatState(null)).not.toThrow();
    });

    it('should calculate elapsed time when loading unconfirmed state', () => {
      const grid = createSeatGrid();
      const now = Date.now();
      const state = {
        grid,
        selectedIds: ['A1'],
        personCount: PERSON_COUNT.SINGLE,
        remainingTime: 900,
        isConfirmed: false,
        savedAt: now - 100000,
      };
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
      const loaded = loadSeatState(storage);
      expect(loaded.remainingTime).toBeLessThan(900);
      expect(loaded.remainingTime).toBeGreaterThan(0);
    });
  });

  describe('updatePriceZoneConfig', () => {
    it('should return updated config without mutating original', () => {
      const grid = createSeatGrid();
      const originalVipPrice = PRICE_ZONE_CONFIG[PRICE_ZONES.VIP].price;
      const result = updatePriceZoneConfig(grid, PRICE_ZONES.VIP, { price: 200 });

      expect(PRICE_ZONE_CONFIG[PRICE_ZONES.VIP].price).toBe(originalVipPrice);
      expect(result.priceZoneConfig[PRICE_ZONES.VIP].price).toBe(200);
    });

    it('should return updated grid with new prices', () => {
      const grid = createSeatGrid();
      const result = updatePriceZoneConfig(grid, PRICE_ZONES.VIP, { price: 200 });

      expect(result.grid[0][0].price).toBe(200);
      expect(result.grid[1][0].price).toBe(200);
      expect(result.grid[2][0].price).toBe(200);
    });

    it('should not change seats in other zones', () => {
      const grid = createSeatGrid();
      const result = updatePriceZoneConfig(grid, PRICE_ZONES.VIP, { price: 200 });

      expect(result.grid[4][0].price).toBe(PRICE_ZONE_CONFIG[PRICE_ZONES.STANDARD].price);
      expect(result.grid[8][0].price).toBe(PRICE_ZONE_CONFIG[PRICE_ZONES.ECONOMY].price);
    });

    it('should return original grid and config for invalid zone', () => {
      const grid = createSeatGrid();
      const result = updatePriceZoneConfig(grid, 'invalid', { price: 999 });

      expect(result.grid).toBe(grid);
      expect(result.priceZoneConfig).toEqual(PRICE_ZONE_CONFIG);
    });

    it('should merge config properties partially', () => {
      const grid = createSeatGrid();
      const result = updatePriceZoneConfig(grid, PRICE_ZONES.VIP, { price: 150 });

      expect(result.priceZoneConfig[PRICE_ZONES.VIP].price).toBe(150);
      expect(result.priceZoneConfig[PRICE_ZONES.VIP].name).toBe('VIP区');
      expect(result.priceZoneConfig[PRICE_ZONES.VIP].color).toBe('#fee2e2');
    });

    it('should accept custom currentConfig', () => {
      const grid = createSeatGrid();
      const customConfig = {
        ...PRICE_ZONE_CONFIG,
        [PRICE_ZONES.VIP]: { ...PRICE_ZONE_CONFIG[PRICE_ZONES.VIP], price: 150 },
      };
      const result = updatePriceZoneConfig(grid, PRICE_ZONES.VIP, { price: 180 }, customConfig);

      expect(result.priceZoneConfig[PRICE_ZONES.VIP].price).toBe(180);
      expect(customConfig[PRICE_ZONES.VIP].price).toBe(150);
    });

    it('should not mutate the grid', () => {
      const grid = createSeatGrid();
      const originalPrice = grid[0][0].price;
      updatePriceZoneConfig(grid, PRICE_ZONES.VIP, { price: 200 });
      expect(grid[0][0].price).toBe(originalPrice);
    });
  });

  describe('handleMultiPersonSeatClick', () => {
    it('should select adjacent seats when available for double mode', () => {
      const grid = createSeatGrid();
      const result = handleMultiPersonSeatClick(grid, 0, 0, PERSON_COUNT.DOUBLE, []);

      expect(result.changed).toBe(true);
      expect(result.needsFallback).toBe(false);
      expect(result.selected).toEqual(expect.arrayContaining(['A1', 'A2']));
      expect(result.grid[0][0].status).toBe(SEAT_STATUS.SELECTED);
      expect(result.grid[0][1].status).toBe(SEAT_STATUS.SELECTED);
    });

    it('should select adjacent seats when available for triple mode', () => {
      const grid = createSeatGrid();
      const result = handleMultiPersonSeatClick(grid, 0, 5, PERSON_COUNT.TRIPLE, []);

      expect(result.changed).toBe(true);
      expect(result.needsFallback).toBe(false);
      expect(result.selected.length).toBe(3);
    });

    it('should return needsFallback=true when no adjacent seats available', () => {
      const grid = createSeatGrid();
      grid[0][1].status = SEAT_STATUS.LOCKED;
      grid[0][2].status = SEAT_STATUS.LOCKED;
      const result = handleMultiPersonSeatClick(grid, 0, 0, PERSON_COUNT.DOUBLE, []);

      expect(result.changed).toBe(false);
      expect(result.needsFallback).toBe(true);
      expect(result.selected).toEqual([]);
    });

    it('should deselect a previously selected seat', () => {
      const grid = createSeatGrid();
      grid[0][0].status = SEAT_STATUS.SELECTED;
      const result = handleMultiPersonSeatClick(grid, 0, 0, PERSON_COUNT.DOUBLE, ['A1']);

      expect(result.changed).toBe(true);
      expect(result.needsFallback).toBe(false);
      expect(result.grid[0][0].status).toBe(SEAT_STATUS.AVAILABLE);
      expect(result.selected).not.toContain('A1');
    });

    it('should not change locked seats', () => {
      const grid = createSeatGrid();
      grid[0][0].status = SEAT_STATUS.LOCKED;
      const result = handleMultiPersonSeatClick(grid, 0, 0, PERSON_COUNT.DOUBLE, []);

      expect(result.changed).toBe(false);
      expect(result.needsFallback).toBe(false);
    });

    it('should not change unavailable seats', () => {
      const grid = createSeatGrid();
      grid[0][0].status = SEAT_STATUS.UNAVAILABLE;
      const result = handleMultiPersonSeatClick(grid, 0, 0, PERSON_COUNT.DOUBLE, []);

      expect(result.changed).toBe(false);
      expect(result.needsFallback).toBe(false);
    });

    it('should handle null/undefined seat gracefully', () => {
      const grid = createSeatGrid();
      const result = handleMultiPersonSeatClick(grid, 99, 0, PERSON_COUNT.DOUBLE, []);

      expect(result.changed).toBe(false);
      expect(result.needsFallback).toBe(false);
    });

    it('should not mutate original grid', () => {
      const grid = createSeatGrid();
      const originalStatus = grid[0][0].status;
      handleMultiPersonSeatClick(grid, 0, 0, PERSON_COUNT.DOUBLE, []);
      expect(grid[0][0].status).toBe(originalStatus);
    });

    it('should return needsFallback when all adjacent seats are blocked', () => {
      const grid = createSeatGrid();
      for (let i = 0; i < TOTAL_COLS; i++) {
        if (grid[4][i].status === SEAT_STATUS.AVAILABLE) {
          grid[4][i].status = SEAT_STATUS.LOCKED;
        }
      }
      grid[4][5].status = SEAT_STATUS.AVAILABLE;
      const result = handleMultiPersonSeatClick(grid, 4, 5, PERSON_COUNT.TRIPLE, []);

      expect(result.needsFallback).toBe(true);
      expect(result.changed).toBe(false);
    });

    it('should append to existing selected IDs when adjacent found', () => {
      const grid = createSeatGrid();
      grid[4][0].status = SEAT_STATUS.SELECTED;
      const result = handleMultiPersonSeatClick(grid, 0, 0, PERSON_COUNT.DOUBLE, ['E1']);

      expect(result.changed).toBe(true);
      expect(result.selected).toEqual(expect.arrayContaining(['E1', 'A1', 'A2']));
    });
  });

  describe('canAddSeat', () => {
    it('should always allow adding for SINGLE mode', () => {
      expect(canAddSeat([], PERSON_COUNT.SINGLE)).toBe(true);
      expect(canAddSeat(['A1'], PERSON_COUNT.SINGLE)).toBe(true);
      expect(canAddSeat(['A1', 'A2', 'A3'], PERSON_COUNT.SINGLE)).toBe(true);
    });

    it('should allow adding when under limit for DOUBLE mode', () => {
      expect(canAddSeat([], PERSON_COUNT.DOUBLE)).toBe(true);
      expect(canAddSeat(['A1'], PERSON_COUNT.DOUBLE)).toBe(true);
    });

    it('should disallow adding when at limit for DOUBLE mode', () => {
      expect(canAddSeat(['A1', 'A2'], PERSON_COUNT.DOUBLE)).toBe(false);
    });

    it('should allow adding when under limit for TRIPLE mode', () => {
      expect(canAddSeat([], PERSON_COUNT.TRIPLE)).toBe(true);
      expect(canAddSeat(['A1'], PERSON_COUNT.TRIPLE)).toBe(true);
      expect(canAddSeat(['A1', 'A2'], PERSON_COUNT.TRIPLE)).toBe(true);
    });

    it('should disallow adding when at limit for TRIPLE mode', () => {
      expect(canAddSeat(['A1', 'A2', 'A3'], PERSON_COUNT.TRIPLE)).toBe(false);
    });

    it('should return true for non-array selectedIds', () => {
      expect(canAddSeat(null, PERSON_COUNT.DOUBLE)).toBe(true);
      expect(canAddSeat(undefined, PERSON_COUNT.DOUBLE)).toBe(true);
    });
  });

  describe('handleManualSeatClick', () => {
    it('should select a seat when under person limit', () => {
      const grid = createSeatGrid();
      const result = handleManualSeatClick(grid, 0, 0, PERSON_COUNT.DOUBLE, []);

      expect(result.changed).toBe(true);
      expect(result.isOverLimit).toBe(false);
      expect(result.selected).toContain('A1');
      expect(result.grid[0][0].status).toBe(SEAT_STATUS.SELECTED);
    });

    it('should return isOverLimit=true when at person limit', () => {
      const grid = createSeatGrid();
      grid[0][0].status = SEAT_STATUS.SELECTED;
      grid[0][1].status = SEAT_STATUS.SELECTED;
      const result = handleManualSeatClick(grid, 0, 2, PERSON_COUNT.DOUBLE, ['A1', 'A2']);

      expect(result.changed).toBe(false);
      expect(result.isOverLimit).toBe(true);
      expect(result.grid[0][2].status).toBe(SEAT_STATUS.AVAILABLE);
    });

    it('should allow deselecting a seat even at person limit', () => {
      const grid = createSeatGrid();
      grid[0][0].status = SEAT_STATUS.SELECTED;
      grid[0][1].status = SEAT_STATUS.SELECTED;
      const result = handleManualSeatClick(grid, 0, 0, PERSON_COUNT.DOUBLE, ['A1', 'A2']);

      expect(result.changed).toBe(true);
      expect(result.isOverLimit).toBe(false);
      expect(result.selected).not.toContain('A1');
      expect(result.grid[0][0].status).toBe(SEAT_STATUS.AVAILABLE);
    });

    it('should not change locked or unavailable seats', () => {
      const grid = createSeatGrid();
      grid[0][0].status = SEAT_STATUS.LOCKED;
      const lockedResult = handleManualSeatClick(grid, 0, 0, PERSON_COUNT.DOUBLE, []);
      expect(lockedResult.changed).toBe(false);
      expect(lockedResult.isOverLimit).toBe(false);

      grid[0][1].status = SEAT_STATUS.UNAVAILABLE;
      const unavailableResult = handleManualSeatClick(grid, 0, 1, PERSON_COUNT.DOUBLE, []);
      expect(unavailableResult.changed).toBe(false);
    });

    it('should handle non-existent seat gracefully', () => {
      const grid = createSeatGrid();
      const result = handleManualSeatClick(grid, 99, 0, PERSON_COUNT.DOUBLE, []);
      expect(result.changed).toBe(false);
      expect(result.isOverLimit).toBe(false);
    });

    it('should not mutate original grid', () => {
      const grid = createSeatGrid();
      const originalStatus = grid[0][0].status;
      handleManualSeatClick(grid, 0, 0, PERSON_COUNT.DOUBLE, []);
      expect(grid[0][0].status).toBe(originalStatus);
    });

    it('should allow selecting up to exactly personCount for TRIPLE', () => {
      const grid = createSeatGrid();
      let result1 = handleManualSeatClick(grid, 0, 0, PERSON_COUNT.TRIPLE, []);
      expect(result1.isOverLimit).toBe(false);

      let result2 = handleManualSeatClick(result1.grid, 0, 1, PERSON_COUNT.TRIPLE, result1.selected);
      expect(result2.isOverLimit).toBe(false);

      let result3 = handleManualSeatClick(result2.grid, 0, 2, PERSON_COUNT.TRIPLE, result2.selected);
      expect(result3.isOverLimit).toBe(false);

      const result4 = handleManualSeatClick(result3.grid, 0, 3, PERSON_COUNT.TRIPLE, result3.selected);
      expect(result4.isOverLimit).toBe(true);
    });
  });

  describe('mergeLockedIds', () => {
    it('should merge two arrays with deduplication', () => {
      const result = mergeLockedIds(['A1', 'B5'], ['A1', 'C3']);
      expect(result.sort()).toEqual(['A1', 'B5', 'C3'].sort());
      expect(new Set(result).size).toBe(3);
    });

    it('should return newLockedIds when prev is not array', () => {
      expect(mergeLockedIds(null, ['A1'])).toEqual(['A1']);
      expect(mergeLockedIds(undefined, ['A1'])).toEqual(['A1']);
      expect(mergeLockedIds('invalid', ['A1'])).toEqual(['A1']);
    });

    it('should return prevLockedIds when new is not array', () => {
      expect(mergeLockedIds(['A1'], null)).toEqual(['A1']);
      expect(mergeLockedIds(['A1'], undefined)).toEqual(['A1']);
      expect(mergeLockedIds(['A1'], 123)).toEqual(['A1']);
    });

    it('should return empty array when both are not arrays', () => {
      expect(mergeLockedIds(null, null)).toEqual([]);
      expect(mergeLockedIds(undefined, undefined)).toEqual([]);
    });

    it('should return new array (not reference)', () => {
      const prev = ['A1'];
      const newIds = ['B5'];
      const result = mergeLockedIds(prev, newIds);
      expect(result).not.toBe(prev);
      expect(result).not.toBe(newIds);
    });

    it('should handle empty arrays correctly', () => {
      expect(mergeLockedIds([], [])).toEqual([]);
      expect(mergeLockedIds([], ['A1'])).toEqual(['A1']);
      expect(mergeLockedIds(['A1'], [])).toEqual(['A1']);
    });
  });
});
