import {
  CELL_SIZE,
  CELL_SIZE_PREFIX,
  CELL_STATUS,
  PICKUP_CODE_LENGTH,
  MAX_PICKUP_ATTEMPTS,
  LOCK_DURATION_SECONDS,
  DEFAULT_RETENTION_HOURS,
  PACKAGE_STATUS,
} from './constants.js';

export function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function generatePickupCode(existingCodes, length = PICKUP_CODE_LENGTH) {
  const existingSet = new Set(Array.isArray(existingCodes) ? existingCodes : []);
  let code;
  let attempts = 0;
  const maxAttempts = 1000;

  do {
    code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    attempts++;
  } while (existingSet.has(code) && attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    return null;
  }

  return code;
}

export function generateCellCode(size, index) {
  const prefix = CELL_SIZE_PREFIX[size];
  const paddedIndex = String(index + 1).padStart(2, '0');
  return `${prefix}${paddedIndex}`;
}

export function createCells(config) {
  const { largeCount = 0, mediumCount = 0, smallCount = 0 } = config;
  const cells = [];

  for (let i = 0; i < largeCount; i++) {
    cells.push({
      id: generateId('cell_'),
      code: generateCellCode(CELL_SIZE.LARGE, i),
      size: CELL_SIZE.LARGE,
      status: CELL_STATUS.AVAILABLE,
      packageId: null,
    });
  }

  for (let i = 0; i < mediumCount; i++) {
    cells.push({
      id: generateId('cell_'),
      code: generateCellCode(CELL_SIZE.MEDIUM, i),
      size: CELL_SIZE.MEDIUM,
      status: CELL_STATUS.AVAILABLE,
      packageId: null,
    });
  }

  for (let i = 0; i < smallCount; i++) {
    cells.push({
      id: generateId('cell_'),
      code: generateCellCode(CELL_SIZE.SMALL, i),
      size: CELL_SIZE.SMALL,
      status: CELL_STATUS.AVAILABLE,
      packageId: null,
    });
  }

  return cells;
}

export function findAvailableCell(cells, size, packages) {
  if (!Array.isArray(cells) || cells.length === 0) return null;

  const pendingPackageIds = new Set(
    (packages || [])
      .filter((p) => p.status === PACKAGE_STATUS.PENDING)
      .map((p) => p.id)
  );

  const availableCell = cells.find(
    (cell) =>
      cell.size === size &&
      cell.status === CELL_STATUS.AVAILABLE &&
      (!cell.packageId || !pendingPackageIds.has(cell.packageId))
  );

  return availableCell || null;
}

export function allocateCell(cells, packages, cellId, packageId) {
  return cells.map((cell) => {
    if (cell.id === cellId) {
      return {
        ...cell,
        status: CELL_STATUS.OCCUPIED,
        packageId,
      };
    }
    return cell;
  });
}

export function releaseCell(cells, cellId) {
  return cells.map((cell) => {
    if (cell.id === cellId) {
      return {
        ...cell,
        status: CELL_STATUS.AVAILABLE,
        packageId: null,
      };
    }
    return cell;
  });
}

export function isOverdue(packageDeliveryTime, now = Date.now(), retentionHours = DEFAULT_RETENTION_HOURS) {
  if (!packageDeliveryTime) return false;
  const retentionMs = retentionHours * 60 * 60 * 1000;
  return now - packageDeliveryTime > retentionMs;
}

export function getOverdueHours(packageDeliveryTime, now = Date.now(), retentionHours = DEFAULT_RETENTION_HOURS) {
  if (!packageDeliveryTime) return 0;
  const retentionMs = retentionHours * 60 * 60 * 1000;
  const overdueMs = now - packageDeliveryTime - retentionMs;
  if (overdueMs <= 0) return 0;
  return Math.floor(overdueMs / (60 * 60 * 1000));
}

export function getOverduePackages(packages, now = Date.now(), retentionHours = DEFAULT_RETENTION_HOURS) {
  return (packages || []).filter(
    (p) =>
      p.status === PACKAGE_STATUS.PENDING &&
      isOverdue(p.deliveredAt, now, retentionHours)
  );
}

export function updateCellStatuses(cells, packages, now = Date.now(), retentionHours = DEFAULT_RETENTION_HOURS) {
  const overduePackageIds = new Set(
    getOverduePackages(packages, now, retentionHours).map((p) => p.id)
  );

  return cells.map((cell) => {
    if (cell.packageId && overduePackageIds.has(cell.packageId)) {
      return { ...cell, status: CELL_STATUS.OVERDUE };
    }
    if (cell.packageId && cell.status === CELL_STATUS.OVERDUE && !overduePackageIds.has(cell.packageId)) {
      return { ...cell, status: CELL_STATUS.OCCUPIED };
    }
    return cell;
  });
}

export function validatePhone(phone) {
  if (!phone) return false;
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

export function validatePickupCode(code) {
  if (!code) return false;
  const codeRegex = /^\d{6}$/;
  return codeRegex.test(code);
}

export function maskPhone(phone) {
  if (!phone || phone.length < 11) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(7);
}

export function getLastFourChars(str) {
  if (!str) return '';
  return str.slice(-4);
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function checkPickupAttempts(attempts) {
  const now = Date.now();
  const safeAttempts = attempts || { count: 0, lastAttempt: 0, lockedUntil: 0 };

  if (safeAttempts.lockedUntil && now < safeAttempts.lockedUntil) {
    return {
      allowed: false,
      remainingSeconds: Math.ceil((safeAttempts.lockedUntil - now) / 1000),
      attempts: safeAttempts,
    };
  }

  return {
    allowed: true,
    remainingSeconds: 0,
    attempts: safeAttempts,
  };
}

export function recordFailedPickupAttempt(attempts) {
  const now = Date.now();
  const safeAttempts = attempts || { count: 0, lastAttempt: 0, lockedUntil: 0 };
  const newCount = safeAttempts.count + 1;

  if (newCount >= MAX_PICKUP_ATTEMPTS) {
    return {
      count: 0,
      lastAttempt: now,
      lockedUntil: now + LOCK_DURATION_SECONDS * 1000,
    };
  }

  return {
    count: newCount,
    lastAttempt: now,
    lockedUntil: 0,
  };
}

export function resetPickupAttempts() {
  return {
    count: 0,
    lastAttempt: 0,
    lockedUntil: 0,
  };
}

export function getStatistics(packages, cells, pickupRecords, deliveryRecords, now = Date.now()) {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  const todayDeliveries = (deliveryRecords || []).filter(
    (r) => r.deliveredAt >= todayMs
  ).length;

  const todayPickups = (pickupRecords || []).filter(
    (r) => r.pickedUpAt >= todayMs
  ).length;

  const occupiedCells = (cells || []).filter(
    (c) => c.status === CELL_STATUS.OCCUPIED || c.status === CELL_STATUS.OVERDUE
  ).length;

  const availableCells = (cells || []).filter(
    (c) => c.status === CELL_STATUS.AVAILABLE
  ).length;

  const sizeUsage = {
    [CELL_SIZE.LARGE]: { total: 0, used: 0 },
    [CELL_SIZE.MEDIUM]: { total: 0, used: 0 },
    [CELL_SIZE.SMALL]: { total: 0, used: 0 },
  };

  (cells || []).forEach((cell) => {
    sizeUsage[cell.size].total++;
    if (cell.status === CELL_STATUS.OCCUPIED || cell.status === CELL_STATUS.OVERDUE) {
      sizeUsage[cell.size].used++;
    }
  });

  return {
    todayDeliveries,
    todayPickups,
    occupiedCells,
    availableCells,
    sizeUsage,
  };
}

export function getDailyTrend(pickupRecords, deliveryRecords, days = 7, now = Date.now()) {
  const trend = [];
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayStart = date.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
    const dateStr = formatDate(dayStart);

    const deliveries = (deliveryRecords || []).filter(
      (r) => r.deliveredAt >= dayStart && r.deliveredAt <= dayEnd
    ).length;

    const pickups = (pickupRecords || []).filter(
      (r) => r.pickedUpAt >= dayStart && r.pickedUpAt <= dayEnd
    ).length;

    trend.push({
      date: dateStr,
      deliveries,
      pickups,
    });
  }

  return trend;
}

export function findPackageByPickupCode(packages, code) {
  if (!code) return null;
  const found = (packages || []).find(
    (p) => p.pickupCode === code && p.status === PACKAGE_STATUS.PENDING
  );
  return found || null;
}

export function regeneratePickupCode(packages, packageId) {
  const safePackages = Array.isArray(packages) ? packages : [];
  const targetPackage = safePackages.find((p) => p.id === packageId);
  if (!targetPackage) {
    return { success: false, error: '包裹不存在' };
  }

  const existingCodes = safePackages
    .filter((p) => p.status === PACKAGE_STATUS.PENDING && p.id !== packageId)
    .map((p) => p.pickupCode);

  const newCode = generatePickupCode(existingCodes);
  if (!newCode) return { success: false, error: '无法生成新的取件码' };

  const updatedPackages = safePackages.map((p) => {
    if (p.id === packageId) {
      return { ...p, pickupCode: newCode, codeRegeneratedAt: Date.now() };
    }
    return p;
  });

  return { success: true, newCode, updatedPackages };
}

export function verifyPackageSize(size) {
  return (
    size === CELL_SIZE.LARGE ||
    size === CELL_SIZE.MEDIUM ||
    size === CELL_SIZE.SMALL
  );
}

export function validateDeliveryForm(data) {
  const errors = {};

  if (!data.phone) {
    errors.phone = '请输入手机号';
  } else if (!validatePhone(data.phone)) {
    errors.phone = '请输入正确的11位手机号';
  }

  if (!data.trackingNo) {
    errors.trackingNo = '请输入快递单号';
  }

  if (!data.size) {
    errors.size = '请选择包裹尺寸';
  } else if (!verifyPackageSize(data.size)) {
    errors.size = '无效的包裹尺寸';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function createPackage(data, code, cellId) {
  return {
    id: generateId('pkg_'),
    phone: data.phone,
    size: data.size,
    trackingNo: data.trackingNo,
    remark: data.remark || '',
    pickupCode: code,
    cellId,
    status: PACKAGE_STATUS.PENDING,
    deliveredAt: Date.now(),
    pickedUpAt: null,
    pickedUpBy: null,
    processed: false,
  };
}

export function createDeliveryRecord(pkg) {
  return {
    id: generateId('delivery_'),
    packageId: pkg.id,
    cellId: pkg.cellId,
    size: pkg.size,
    deliveredAt: pkg.deliveredAt,
  };
}

export function createPickupRecord(pkg, operator = 'user') {
  return {
    id: generateId('pickup_'),
    packageId: pkg.id,
    cellId: pkg.cellId,
    size: pkg.size,
    pickedUpAt: Date.now(),
    pickedUpBy: operator,
  };
}

export function pickupPackage(packages, packageId, operator = 'user') {
  const updatedPackages = (packages || []).map((p) => {
    if (p.id === packageId) {
      return {
        ...p,
        status: operator === 'admin' ? PACKAGE_STATUS.ADMIN_PICKED : PACKAGE_STATUS.PICKED_UP,
        pickedUpAt: Date.now(),
        pickedUpBy: operator,
      };
    }
    return p;
  });

  const pkg = (packages || []).find((p) => p.id === packageId);
  if (!pkg) return { success: false, error: '包裹不存在' };

  const record = createPickupRecord(pkg, operator);

  return {
    success: true,
    updatedPackages,
    record,
    cellId: pkg.cellId,
  };
}

export function markOverdueAsProcessed(packages, packageIds) {
  const idSet = new Set(packageIds || []);
  return (packages || []).map((p) => {
    if (idSet.has(p.id)) {
      return { ...p, processed: true, processedAt: Date.now() };
    }
    return p;
  });
}

export function arrangeCellsInGrid(cells, rows = 4) {
  const sorted = [...(cells || [])].sort((a, b) => {
    const sizeOrder = { [CELL_SIZE.LARGE]: 0, [CELL_SIZE.MEDIUM]: 1, [CELL_SIZE.SMALL]: 2 };
    if (sizeOrder[a.size] !== sizeOrder[b.size]) {
      return sizeOrder[a.size] - sizeOrder[b.size];
    }
    return a.code.localeCompare(b.code);
  });

  const total = sorted.length;
  const cols = Math.ceil(total / rows);
  const grid = [];

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const idx = c * rows + r;
      if (idx < total) {
        row.push(sorted[idx]);
      }
    }
    if (row.length > 0) {
      grid.push(row);
    }
  }

  return grid;
}
