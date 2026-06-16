export const MESSAGE_STATUS = {
  DELAYED: 'delayed',
  PENDING: 'pending',
  CONSUMING: 'consuming',
  CONSUMED: 'consumed',
  DEAD_LETTER: 'dead_letter',
};

export const MESSAGE_STATUS_LABELS = {
  [MESSAGE_STATUS.DELAYED]: '延迟中',
  [MESSAGE_STATUS.PENDING]: '待消费',
  [MESSAGE_STATUS.CONSUMING]: '消费中',
  [MESSAGE_STATUS.CONSUMED]: '已消费',
  [MESSAGE_STATUS.DEAD_LETTER]: '已进入死信',
};

export const FAIL_REASONS = [
  '消费超时',
  '格式错误',
  '处理异常',
  '网络中断',
];

export const DEFAULT_MAX_RETRIES = 3;

export const TOPIC_COLORS = [
  '#aa3bff',
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#f9ca24',
  '#6c5ce7',
  '#a8e6cf',
  '#ff8a5c',
  '#ea8685',
  '#778beb',
];

export const STORAGE_KEYS = {
  TOPICS: 'mq_topics',
  MESSAGES: 'mq_messages',
  CONSUMER_GROUPS: 'mq_consumer_groups',
  DEAD_LETTERS: 'mq_dead_letters',
  BACKLOG_HISTORY: 'mq_backlog_history',
};

export const CHART_UPDATE_INTERVAL = 5000;
export const CHART_DURATION_MINUTES = 30;
export const CHART_MAX_POINTS = (CHART_DURATION_MINUTES * 60 * 1000) / CHART_UPDATE_INTERVAL;
export const COUNTDOWN_UPDATE_INTERVAL = 1000;
