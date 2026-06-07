import {
  STORAGE_KEY,
  PREFS_STORAGE_KEY,
  MAX_ACTIVE_NOTIFICATIONS,
  NOTIFICATION_TYPES,
  DEFAULT_PREFS,
  SYSTEM_TEMPLATES,
  MESSAGE_TEMPLATES,
  TASK_TEMPLATES,
} from './constants.js';

const TYPE_TEMPLATES = {
  [NOTIFICATION_TYPES.SYSTEM]: SYSTEM_TEMPLATES,
  [NOTIFICATION_TYPES.MESSAGE]: MESSAGE_TEMPLATES,
  [NOTIFICATION_TYPES.TASK]: TASK_TEMPLATES,
};

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getDefaultNotifications() {
  const now = Date.now();
  return [
    {
      id: generateId(),
      type: NOTIFICATION_TYPES.SYSTEM,
      title: '欢迎使用通知中心',
      summary: '您的所有通知将汇聚在这里，支持按类型分组查看、一键已读等功能。',
      content: '欢迎使用 Solocoder 通知中心！您的系统通知、私信消息和任务提醒都会出现在这里。您可以：\n\n1. 按类型分组查看通知\n2. 单条标记已读或一键全部已读\n3. 展开通知查看完整内容\n4. 在偏好设置中开启/关闭各类通知\n5. 超过 50 条的通知会自动归档到历史记录',
      read: false,
      createdAt: now - 3600_000,
      archived: false,
    },
    {
      id: generateId(),
      type: NOTIFICATION_TYPES.TASK,
      title: '今日待办任务汇总',
      summary: '您今天有 3 个待处理任务，其中 1 个即将到期，请及时处理。',
      content: '今日任务概览：\n\n🔴 高优先级：修复登录页面样式错位（即将到期）\n🟡 中优先级：实现用户头像上传功能\n🟡 中优先级：优化列表加载速度\n\n建议优先处理高优先级任务，合理安排工作时间。',
      read: false,
      createdAt: now - 7200_000,
      archived: false,
    },
    {
      id: generateId(),
      type: NOTIFICATION_TYPES.MESSAGE,
      title: '产品经理：需求评审安排',
      summary: '明天下午 3 点将举行新一期需求评审会议，请提前准备相关材料。',
      content: '大家好，\n\n明天（周四）下午 3:00-4:30 我们将举行 Q3 第二期需求评审会议，地点在 3 楼大会议室。\n\n请各位提前准备：\n1. 各自负责模块的需求理解和技术预研\n2. 预估开发工时和风险点\n3. 需协调的资源和依赖\n\n会议材料已上传到共享文档，请查收。',
      read: true,
      createdAt: now - 86400_000,
      archived: false,
    },
  ];
}

export function createNotification(type, customData = {}) {
  const templates = TYPE_TEMPLATES[type];
  if (!templates || templates.length === 0) {
    throw new Error(`Invalid notification type: ${type}`);
  }
  const template = templates[Math.floor(Math.random() * templates.length)];
  return {
    id: generateId(),
    type,
    title: customData.title ?? template.title,
    summary: customData.summary ?? template.content.slice(0, 60) + (template.content.length > 60 ? '…' : ''),
    content: customData.content ?? template.content,
    read: customData.read ?? false,
    createdAt: customData.createdAt ?? Date.now(),
    archived: customData.archived ?? false,
  };
}

export function loadNotifications(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return { active: getDefaultNotifications(), archived: [] };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = getDefaultNotifications();
      saveNotifications({ active: defaults, archived: [] }, storage);
      return { active: defaults, archived: [] };
    }
    const parsed = JSON.parse(raw);
    return {
      active: Array.isArray(parsed.active) ? parsed.active : [],
      archived: Array.isArray(parsed.archived) ? parsed.archived : [],
    };
  } catch {
    return { active: getDefaultNotifications(), archived: [] };
  }
}

export function saveNotifications(state, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function loadPrefs(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return { ...DEFAULT_PREFS };
  try {
    const raw = storage.getItem(PREFS_STORAGE_KEY);
    if (!raw) {
      savePrefs(DEFAULT_PREFS, storage);
      return { ...DEFAULT_PREFS };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage errors
  }
}

export function markAsRead(state, notificationId) {
  const newActive = state.active.map((n) =>
    n.id === notificationId ? { ...n, read: true } : n
  );
  const newArchived = state.archived.map((n) =>
    n.id === notificationId ? { ...n, read: true } : n
  );
  return { active: newActive, archived: newArchived };
}

export function markAllAsRead(state) {
  const newActive = state.active.map((n) => ({ ...n, read: true }));
  const newArchived = state.archived.map((n) => ({ ...n, read: true }));
  return { active: newActive, archived: newArchived };
}

export function markAllOfTypeAsRead(state, type) {
  const newActive = state.active.map((n) =>
    n.type === type ? { ...n, read: true } : n
  );
  return { ...state, active: newActive };
}

export function addNotification(state, notification, maxActive = MAX_ACTIVE_NOTIFICATIONS) {
  let newActive = [notification, ...state.active];
  let newArchived = [...state.archived];

  while (newActive.length > maxActive) {
    const oldest = newActive[newActive.length - 1];
    newActive = newActive.slice(0, -1);
    newArchived = [{ ...oldest, archived: true }, ...newArchived];
  }

  return { active: newActive, archived: newArchived };
}

export function groupByType(notifications) {
  const groups = {
    [NOTIFICATION_TYPES.SYSTEM]: [],
    [NOTIFICATION_TYPES.MESSAGE]: [],
    [NOTIFICATION_TYPES.TASK]: [],
  };
  for (const n of notifications) {
    if (groups[n.type]) {
      groups[n.type].push(n);
    }
  }
  return groups;
}

export function getUnreadCount(notifications) {
  return notifications.filter((n) => !n.read).length;
}

export function getUnreadCountByType(notifications, type) {
  return notifications.filter((n) => !n.read && n.type === type).length;
}

export function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60_000) {
    return '刚刚';
  }
  if (diff < 3600_000) {
    const mins = Math.floor(diff / 60_000);
    return `${mins} 分钟前`;
  }
  if (diff < 86400_000) {
    const hours = Math.floor(diff / 3600_000);
    return `${hours} 小时前`;
  }
  if (diff < 7 * 86400_000) {
    const days = Math.floor(diff / 86400_000);
    return `${days} 天前`;
  }

  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getEnabledTypes(prefs) {
  return Object.entries(prefs)
    .filter(([, enabled]) => enabled)
    .map(([type]) => type);
}

export function pickRandomEnabledType(prefs) {
  const enabled = getEnabledTypes(prefs);
  if (enabled.length === 0) return null;
  return enabled[Math.floor(Math.random() * enabled.length)];
}

export function updatePref(prefs, type, enabled) {
  return { ...prefs, [type]: enabled };
}
