export const STORAGE_KEYS = {
  LOCKER_CONFIG: 'locker_config',
  LOCKER_CELLS: 'locker_cells',
  PACKAGES: 'locker_packages',
  PICKUP_RECORDS: 'locker_pickup_records',
  DELIVERY_RECORDS: 'locker_delivery_records',
  RETENTION_HOURS: 'locker_retention_hours',
};

export const CELL_SIZE = {
  LARGE: 'large',
  MEDIUM: 'medium',
  SMALL: 'small',
};

export const CELL_SIZE_LABELS = {
  [CELL_SIZE.LARGE]: '大号',
  [CELL_SIZE.MEDIUM]: '中号',
  [CELL_SIZE.SMALL]: '小号',
};

export const CELL_SIZE_PREFIX = {
  [CELL_SIZE.LARGE]: 'A',
  [CELL_SIZE.MEDIUM]: 'B',
  [CELL_SIZE.SMALL]: 'C',
};

export const CELL_SIZE_COLORS = {
  [CELL_SIZE.LARGE]: '#3b82f6',
  [CELL_SIZE.MEDIUM]: '#22c55e',
  [CELL_SIZE.SMALL]: '#6b7280',
};

export const CELL_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  OVERDUE: 'overdue',
};

export const DEFAULT_CONFIG = {
  largeCount: 8,
  mediumCount: 12,
  smallCount: 20,
};

export const DEFAULT_RETENTION_HOURS = 48;

export const RETENTION_OPTIONS = [24, 48, 72];

export const MAX_PICKUP_ATTEMPTS = 5;
export const LOCK_DURATION_SECONDS = 30;

export const PICKUP_CODE_LENGTH = 6;

export const CELL_GRID_ROWS = 4;
export const TOTAL_CELLS = 40;

export const PACKAGE_STATUS = {
  PENDING: 'pending',
  PICKED_UP: 'picked_up',
  ADMIN_PICKED: 'admin_picked',
  PROCESSED: 'processed',
};
