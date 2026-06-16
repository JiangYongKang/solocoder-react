import {
  MESSAGE_STATUS,
  DEFAULT_MAX_RETRIES,
  FAIL_REASONS,
  CHART_MAX_POINTS,
  CHART_DURATION_MINUTES,
  TOPIC_COLORS,
} from './constants.js';

export function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatCountdown(remainingMs) {
  if (remainingMs <= 0) return '0s';
  const seconds = Math.ceil(remainingMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m${secs}s`;
}

export function createTopic(name) {
  if (!name || !name.trim()) return null;
  return {
    id: generateId('topic_'),
    name: name.trim(),
    maxRetries: DEFAULT_MAX_RETRIES,
    createdAt: Date.now(),
  };
}

export function deleteTopicCascade(topicId, topics, messages, consumerGroups, deadLetters) {
  const filteredTopics = topics.filter((t) => t.id !== topicId);
  const filteredMessages = messages.filter((m) => m.topicId !== topicId);
  const filteredGroups = consumerGroups.filter((g) => g.topicId !== topicId);
  const filteredDeadLetters = deadLetters.filter((d) => d.topicId !== topicId);
  return {
    topics: filteredTopics,
    messages: filteredMessages,
    consumerGroups: filteredGroups,
    deadLetters: filteredDeadLetters,
  };
}

export function publishMessage(topicId, content, sendMode, delaySeconds) {
  if (!topicId || !content || !content.trim()) return null;
  const now = Date.now();
  const isDelayed = sendMode === 'delayed' && delaySeconds > 0;
  return {
    id: generateId('msg_'),
    topicId,
    content: content.trim(),
    status: isDelayed ? MESSAGE_STATUS.DELAYED : MESSAGE_STATUS.PENDING,
    retryCount: 0,
    scheduledTime: isDelayed ? now + delaySeconds * 1000 : null,
    createdAt: now,
    consumedBy: {},
  };
}

export function isDelayedReady(message, now = Date.now()) {
  if (message.status !== MESSAGE_STATUS.DELAYED) return false;
  if (!message.scheduledTime) return true;
  return now >= message.scheduledTime;
}

export function getRemainingDelay(message, now = Date.now()) {
  if (message.status !== MESSAGE_STATUS.DELAYED || !message.scheduledTime) return 0;
  return Math.max(0, message.scheduledTime - now);
}

export function getMessageEffectiveStatus(message, consumerGroups, now = Date.now()) {
  if (message.status === MESSAGE_STATUS.DEAD_LETTER) return MESSAGE_STATUS.DEAD_LETTER;
  if (message.status === MESSAGE_STATUS.DELAYED) {
    if (isDelayedReady(message, now)) return MESSAGE_STATUS.PENDING;
    return MESSAGE_STATUS.DELAYED;
  }
  const topicGroups = consumerGroups.filter((g) => g.topicId === message.topicId);
  if (topicGroups.length === 0) return MESSAGE_STATUS.PENDING;
  const consumedCount = Object.keys(message.consumedBy || {}).length;
  if (consumedCount === 0) return MESSAGE_STATUS.PENDING;
  if (consumedCount >= topicGroups.length) return MESSAGE_STATUS.CONSUMED;
  return MESSAGE_STATUS.CONSUMING;
}

export function getTopicMessages(messages, topicId) {
  if (!Array.isArray(messages) || !topicId) return [];
  return messages.filter((m) => m.topicId === topicId && m.status !== MESSAGE_STATUS.DEAD_LETTER);
}

export function getTopicTotalMessages(messages, topicId) {
  return getTopicMessages(messages, topicId).length;
}

export function getTopicBacklogCount(messages, topicId, consumerGroups, now = Date.now()) {
  const topicMessages = getTopicMessages(messages, topicId);
  const topicGroups = consumerGroups.filter((g) => g.topicId === topicId);
  if (topicGroups.length === 0) {
    return topicMessages.filter((m) => {
      const status = getMessageEffectiveStatus(m, consumerGroups, now);
      return status !== MESSAGE_STATUS.CONSUMED;
    }).length;
  }
  return topicMessages.filter((m) => {
    const status = getMessageEffectiveStatus(m, consumerGroups, now);
    return status !== MESSAGE_STATUS.CONSUMED;
  }).length;
}

export function getConsumerGroupOffset(consumerGroup, messages) {
  if (!consumerGroup || !Array.isArray(messages)) return 0;
  const topicMessages = messages.filter(
    (m) => m.topicId === consumerGroup.topicId && m.status !== MESSAGE_STATUS.DEAD_LETTER
  );
  return topicMessages.filter((m) => m.consumedBy && m.consumedBy[consumerGroup.id]).length;
}

export function getUnconsumedCount(consumerGroup, messages, now = Date.now()) {
  if (!consumerGroup || !Array.isArray(messages)) return 0;
  const topicMessages = messages.filter(
    (m) => m.topicId === consumerGroup.topicId && m.status !== MESSAGE_STATUS.DEAD_LETTER
  );
  return topicMessages.filter((m) => {
    if (m.consumedBy && m.consumedBy[consumerGroup.id]) return false;
    if (m.status === MESSAGE_STATUS.DELAYED && !isDelayedReady(m, now)) return false;
    return true;
  }).length;
}

export function findNextMessageToConsume(consumerGroup, messages, now = Date.now()) {
  if (!consumerGroup || !Array.isArray(messages)) return null;
  const topicMessages = messages
    .filter((m) => m.topicId === consumerGroup.topicId && m.status !== MESSAGE_STATUS.DEAD_LETTER)
    .sort((a, b) => a.createdAt - b.createdAt);
  for (const msg of topicMessages) {
    if (msg.consumedBy && msg.consumedBy[consumerGroup.id]) continue;
    if (msg.status === MESSAGE_STATUS.DELAYED && !isDelayedReady(msg, now)) continue;
    return msg;
  }
  return null;
}

export function simulateConsume(consumerGroup, messages, now = Date.now()) {
  const nextMsg = findNextMessageToConsume(consumerGroup, messages, now);
  if (!nextMsg) return { updatedMessages: messages, consumed: false };
  const updatedMessages = messages.map((m) => {
    if (m.id !== nextMsg.id) return m;
    const newConsumedBy = { ...m.consumedBy, [consumerGroup.id]: true };
    return { ...m, consumedBy: newConsumedBy };
  });
  return { updatedMessages, consumed: true, consumedMessageId: nextMsg.id };
}

export function shouldMoveToDeadLetter(message, maxRetries) {
  const max = maxRetries != null ? maxRetries : DEFAULT_MAX_RETRIES;
  return message.retryCount >= max;
}

export function simulateFailConsume(messageId, messages, topics) {
  const message = messages.find((m) => m.id === messageId);
  if (!message) return { updatedMessages: messages, shouldDeadLetter: false };
  const topic = topics.find((t) => t.id === message.topicId);
  const newRetryCount = message.retryCount + 1;
  const maxRetries = topic ? topic.maxRetries : DEFAULT_MAX_RETRIES;
  if (newRetryCount >= maxRetries) {
    return {
      updatedMessages: messages.map((m) =>
        m.id === messageId ? { ...m, retryCount: newRetryCount } : m
      ),
      shouldDeadLetter: true,
      deadLetter: {
        id: generateId('dl_'),
        topicId: message.topicId,
        originalMessageId: message.id,
        content: message.content,
        failReason: FAIL_REASONS[Math.floor(Math.random() * FAIL_REASONS.length)],
        retryCount: newRetryCount,
        enteredAt: Date.now(),
      },
    };
  }
  return {
    updatedMessages: messages.map((m) =>
      m.id === messageId ? { ...m, retryCount: newRetryCount } : m
    ),
    shouldDeadLetter: false,
  };
}

export function moveToDeadLetter(messageId, messages, updatedDeadLetters) {
  const resultMessages = messages.map((m) =>
    m.id === messageId ? { ...m, status: MESSAGE_STATUS.DEAD_LETTER } : m
  );
  return { updatedMessages: resultMessages, updatedDeadLetters };
}

export function requeueDeadLetter(deadLetterId, deadLetters, messages) {
  const deadLetter = deadLetters.find((d) => d.id === deadLetterId);
  if (!deadLetter) return { updatedDeadLetters: deadLetters, updatedMessages: messages };
  const updatedDeadLetters = deadLetters.filter((d) => d.id !== deadLetterId);
  const requeuedMessage = {
    id: generateId('msg_'),
    topicId: deadLetter.topicId,
    content: deadLetter.content,
    status: MESSAGE_STATUS.PENDING,
    retryCount: 0,
    scheduledTime: null,
    createdAt: Date.now(),
    consumedBy: {},
  };
  return { updatedDeadLetters, updatedMessages: [...messages, requeuedMessage] };
}

export function deleteDeadLetter(deadLetterId, deadLetters) {
  return deadLetters.filter((d) => d.id !== deadLetterId);
}

export function createConsumerGroup(topicId, name) {
  if (!topicId || !name || !name.trim()) return null;
  return {
    id: generateId('cg_'),
    topicId,
    name: name.trim(),
    createdAt: Date.now(),
  };
}

export function getTopicDeadLetters(deadLetters, topicId) {
  if (!Array.isArray(deadLetters) || !topicId) return [];
  return deadLetters.filter((d) => d.topicId === topicId);
}

export function getBacklogByTopic(topics, messages, consumerGroups, now = Date.now()) {
  const result = {};
  for (const topic of topics) {
    result[topic.id] = getTopicBacklogCount(messages, topic.id, consumerGroups, now);
  }
  return result;
}

export function addBacklogDataPoint(history, backlogs, timestamp = Date.now()) {
  const newPoint = { timestamp, backlogs: { ...backlogs } };
  const updated = [...history, newPoint];
  return updated.slice(-CHART_MAX_POINTS);
}

export function pruneOldBacklogHistory(history, now = Date.now()) {
  const cutoff = now - CHART_DURATION_MINUTES * 60 * 1000;
  return history.filter((p) => p.timestamp >= cutoff);
}

export function processDelayedMessages(messages, now = Date.now()) {
  let changed = false;
  const updated = messages.map((m) => {
    if (m.status === MESSAGE_STATUS.DELAYED && isDelayedReady(m, now)) {
      changed = true;
      return { ...m, status: MESSAGE_STATUS.PENDING };
    }
    return m;
  });
  return { updatedMessages: updated, changed };
}

export function getTotalBacklog(topics, messages, consumerGroups, now = Date.now()) {
  let total = 0;
  for (const topic of topics) {
    total += getTopicBacklogCount(messages, topic.id, consumerGroups, now);
  }
  return total;
}

export function getTopicColor(index) {
  return TOPIC_COLORS[index % TOPIC_COLORS.length];
}
