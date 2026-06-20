export const SEAT_STATUS = {
  AVAILABLE: 'available',
  SELECTED: 'selected',
  LOCKED: 'locked',
  UNAVAILABLE: 'unavailable',
};

export const PRICE_ZONES = {
  VIP: 'vip',
  STANDARD: 'standard',
  ECONOMY: 'economy',
};

export const PRICE_ZONE_CONFIG = {
  [PRICE_ZONES.VIP]: {
    name: 'VIP区',
    price: 120,
    color: '#fee2e2',
    labelColor: '#dc2626',
    borderColor: '#fca5a5',
  },
  [PRICE_ZONES.STANDARD]: {
    name: '标准区',
    price: 80,
    color: '#dbeafe',
    labelColor: '#2563eb',
    borderColor: '#93c5fd',
  },
  [PRICE_ZONES.ECONOMY]: {
    name: '经济区',
    price: 50,
    color: '#dcfce7',
    labelColor: '#16a34a',
    borderColor: '#86efac',
  },
};

export const PERSON_COUNT = {
  SINGLE: 1,
  DOUBLE: 2,
  TRIPLE: 3,
};

export const PERSON_COUNT_LABELS = {
  [PERSON_COUNT.SINGLE]: '单人',
  [PERSON_COUNT.DOUBLE]: '双人',
  [PERSON_COUNT.TRIPLE]: '三人',
};

export const STORAGE_KEY = 'seat_selection_state';

export const LOCK_DURATION_SECONDS = 15 * 60;

export const WARNING_THRESHOLD = 3 * 60;
export const DANGER_THRESHOLD = 1 * 60;

export const TOTAL_ROWS = 10;
export const TOTAL_COLS = 15;

export const ZONE_ROWS = {
  [PRICE_ZONES.VIP]: [0, 1, 2],
  [PRICE_ZONES.STANDARD]: [3, 4, 5, 6],
  [PRICE_ZONES.ECONOMY]: [7, 8, 9],
};

export const UNAVAILABLE_SEATS = [
  { row: 0, col: 7 },
  { row: 1, col: 7 },
  { row: 2, col: 7 },
  { row: 3, col: 0 },
  { row: 3, col: 14 },
  { row: 6, col: 0 },
  { row: 6, col: 14 },
];

export const SEAT_SIZE = 36;
export const SEAT_GAP = 8;
