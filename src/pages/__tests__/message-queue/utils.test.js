import { describe, it, expect } from 'vitest';
import {
  generateId,
  formatDateTime,
  formatCountdown,
  createTopic,
  deleteTopicCascade,
  publishMessage,
  isDelayedReady,
  getRemainingDelay,
  getMessageEffectiveStatus,
  getTopicTotalMessages,
  getTopicBacklogCount,
  getConsumerGroupOffset,
  getUnconsumedCount,
  findNextMessageToConsume,
  simulateConsume,
  shouldMoveToDeadLetter,
  simulateFailConsume,
  moveToDeadLetter,
  requeueDeadLetter,
  deleteDeadLetter,
  createConsumerGroup,
  getTopicDeadLetters,
  getBacklogByTopic,
  addBacklogDataPoint,
  pruneOldBacklogHistory,
  processDelayedMessages,
  getTotalBacklog,
  getTopicColor,
} from '@/pages/message-queue/utils.js';
import {
  MESSAGE_STATUS,
  DEFAULT_MAX_RETRIES,
  TOPIC_COLORS,
} from '@/pages/message-queue/constants.js';

describe('message-queue/utils', () => {
  describe('generateId', () => {
    it('should generate non-empty string ids', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should prepend prefix when provided', () => {
      const id = generateId('topic_');
      expect(id.startsWith('topic_')).toBe(true);
    });

    it('should generate unique ids', () => {
      const ids = new Set(Array.from({ length: 50 }, () => generateId()));
      expect(ids.size).toBe(50);
    });
  });

  describe('formatDateTime', () => {
    it('should format timestamp to readable string', () => {
      const ts = new Date(2024, 0, 15, 10, 30, 45).getTime();
      const result = formatDateTime(ts);
      expect(result).toContain('2024');
      expect(result).toContain('10');
      expect(result).toContain('30');
      expect(result).toContain('45');
    });

    it('should return empty string for null/undefined', () => {
      expect(formatDateTime(null)).toBe('');
      expect(formatDateTime(undefined)).toBe('');
    });
  });

  describe('formatCountdown', () => {
    it('should format seconds only when less than 60', () => {
      expect(formatCountdown(30000)).toBe('30s');
      expect(formatCountdown(5000)).toBe('5s');
    });

    it('should format minutes and seconds when >= 60s', () => {
      expect(formatCountdown(90000)).toBe('1m30s');
      expect(formatCountdown(120000)).toBe('2m0s');
    });

    it('should return 0s for non-positive values', () => {
      expect(formatCountdown(0)).toBe('0s');
      expect(formatCountdown(-1000)).toBe('0s');
    });
  });

  describe('createTopic', () => {
    it('should create a topic with valid name', () => {
      const topic = createTopic('orders');
      expect(topic).not.toBeNull();
      expect(topic.name).toBe('orders');
      expect(topic.maxRetries).toBe(DEFAULT_MAX_RETRIES);
      expect(topic.id).toBeTruthy();
      expect(typeof topic.createdAt).toBe('number');
    });

    it('should trim whitespace from name', () => {
      const topic = createTopic('  orders  ');
      expect(topic.name).toBe('orders');
    });

    it('should return null for empty name', () => {
      expect(createTopic('')).toBeNull();
      expect(createTopic('   ')).toBeNull();
      expect(createTopic(null)).toBeNull();
    });
  });

  describe('deleteTopicCascade', () => {
    it('should remove topic and all related data', () => {
      const topicId = 't1';
      const topics = [{ id: topicId, name: 'test' }, { id: 't2', name: 'other' }];
      const messages = [
        { id: 'm1', topicId, content: 'a' },
        { id: 'm2', topicId: 't2', content: 'b' },
      ];
      const consumerGroups = [
        { id: 'g1', topicId, name: 'g1' },
        { id: 'g2', topicId: 't2', name: 'g2' },
      ];
      const deadLetters = [
        { id: 'd1', topicId, content: 'dead' },
        { id: 'd2', topicId: 't2', content: 'dead2' },
      ];

      const result = deleteTopicCascade(topicId, topics, messages, consumerGroups, deadLetters);
      expect(result.topics).toHaveLength(1);
      expect(result.topics[0].id).toBe('t2');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].topicId).toBe('t2');
      expect(result.consumerGroups).toHaveLength(1);
      expect(result.consumerGroups[0].topicId).toBe('t2');
      expect(result.deadLetters).toHaveLength(1);
      expect(result.deadLetters[0].topicId).toBe('t2');
    });
  });

  describe('publishMessage', () => {
    it('should create an immediate message', () => {
      const msg = publishMessage('t1', 'hello', 'immediate', 0);
      expect(msg).not.toBeNull();
      expect(msg.topicId).toBe('t1');
      expect(msg.content).toBe('hello');
      expect(msg.status).toBe(MESSAGE_STATUS.PENDING);
      expect(msg.retryCount).toBe(0);
      expect(msg.scheduledTime).toBeNull();
    });

    it('should create a delayed message', () => {
      const msg = publishMessage('t1', 'delayed msg', 'delayed', 60);
      expect(msg).not.toBeNull();
      expect(msg.status).toBe(MESSAGE_STATUS.DELAYED);
      expect(msg.scheduledTime).toBeGreaterThan(msg.createdAt);
    });

    it('should create pending message when sendMode is delayed but delaySeconds is 0', () => {
      const msg = publishMessage('t1', 'msg', 'delayed', 0);
      expect(msg.status).toBe(MESSAGE_STATUS.PENDING);
    });

    it('should return null for empty content', () => {
      expect(publishMessage('t1', '', 'immediate', 0)).toBeNull();
      expect(publishMessage('t1', '   ', 'immediate', 0)).toBeNull();
    });

    it('should return null for missing topicId', () => {
      expect(publishMessage(null, 'msg', 'immediate', 0)).toBeNull();
    });
  });

  describe('isDelayedReady', () => {
    it('should return true when scheduled time has passed', () => {
      const msg = {
        status: MESSAGE_STATUS.DELAYED,
        scheduledTime: Date.now() - 1000,
      };
      expect(isDelayedReady(msg)).toBe(true);
    });

    it('should return false when scheduled time has not arrived', () => {
      const msg = {
        status: MESSAGE_STATUS.DELAYED,
        scheduledTime: Date.now() + 60000,
      };
      expect(isDelayedReady(msg)).toBe(false);
    });

    it('should return false for non-delayed messages', () => {
      const msg = { status: MESSAGE_STATUS.PENDING, scheduledTime: null };
      expect(isDelayedReady(msg)).toBe(false);
    });

    it('should return true for delayed message without scheduledTime', () => {
      const msg = { status: MESSAGE_STATUS.DELAYED, scheduledTime: null };
      expect(isDelayedReady(msg)).toBe(true);
    });
  });

  describe('getRemainingDelay', () => {
    it('should return remaining milliseconds for delayed message', () => {
      const futureTime = Date.now() + 30000;
      const msg = { status: MESSAGE_STATUS.DELAYED, scheduledTime: futureTime };
      const remaining = getRemainingDelay(msg);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(30000);
    });

    it('should return 0 for non-delayed messages', () => {
      const msg = { status: MESSAGE_STATUS.PENDING, scheduledTime: null };
      expect(getRemainingDelay(msg)).toBe(0);
    });

    it('should return 0 for expired delayed messages', () => {
      const msg = { status: MESSAGE_STATUS.DELAYED, scheduledTime: Date.now() - 1000 };
      expect(getRemainingDelay(msg)).toBe(0);
    });
  });

  describe('getMessageEffectiveStatus', () => {
    it('should return DEAD_LETTER for dead letter messages', () => {
      const msg = { status: MESSAGE_STATUS.DEAD_LETTER, topicId: 't1', consumedBy: {} };
      expect(getMessageEffectiveStatus(msg, [])).toBe(MESSAGE_STATUS.DEAD_LETTER);
    });

    it('should return DELAYED for delayed messages not yet ready', () => {
      const msg = {
        status: MESSAGE_STATUS.DELAYED,
        topicId: 't1',
        consumedBy: {},
        scheduledTime: Date.now() + 60000,
      };
      expect(getMessageEffectiveStatus(msg, [])).toBe(MESSAGE_STATUS.DELAYED);
    });

    it('should return PENDING for delayed messages that are ready', () => {
      const msg = {
        status: MESSAGE_STATUS.DELAYED,
        topicId: 't1',
        consumedBy: {},
        scheduledTime: Date.now() - 1000,
      };
      expect(getMessageEffectiveStatus(msg, [])).toBe(MESSAGE_STATUS.PENDING);
    });

    it('should return PENDING when no consumer groups exist', () => {
      const msg = { status: MESSAGE_STATUS.PENDING, topicId: 't1', consumedBy: {} };
      expect(getMessageEffectiveStatus(msg, [])).toBe(MESSAGE_STATUS.PENDING);
    });

    it('should return PENDING when no groups have consumed', () => {
      const groups = [{ id: 'g1', topicId: 't1' }];
      const msg = { status: MESSAGE_STATUS.PENDING, topicId: 't1', consumedBy: {} };
      expect(getMessageEffectiveStatus(msg, groups)).toBe(MESSAGE_STATUS.PENDING);
    });

    it('should return CONSUMING when some but not all groups consumed', () => {
      const groups = [
        { id: 'g1', topicId: 't1' },
        { id: 'g2', topicId: 't1' },
      ];
      const msg = { status: MESSAGE_STATUS.PENDING, topicId: 't1', consumedBy: { g1: true } };
      expect(getMessageEffectiveStatus(msg, groups)).toBe(MESSAGE_STATUS.CONSUMING);
    });

    it('should return CONSUMED when all groups have consumed', () => {
      const groups = [
        { id: 'g1', topicId: 't1' },
        { id: 'g2', topicId: 't1' },
      ];
      const msg = {
        status: MESSAGE_STATUS.PENDING,
        topicId: 't1',
        consumedBy: { g1: true, g2: true },
      };
      expect(getMessageEffectiveStatus(msg, groups)).toBe(MESSAGE_STATUS.CONSUMED);
    });
  });

  describe('getTopicTotalMessages', () => {
    it('should count only non-dead-letter messages for a topic', () => {
      const messages = [
        { id: 'm1', topicId: 't1', status: MESSAGE_STATUS.PENDING },
        { id: 'm2', topicId: 't1', status: MESSAGE_STATUS.CONSUMED },
        { id: 'm3', topicId: 't1', status: MESSAGE_STATUS.DEAD_LETTER },
        { id: 'm4', topicId: 't2', status: MESSAGE_STATUS.PENDING },
      ];
      expect(getTopicTotalMessages(messages, 't1')).toBe(2);
    });

    it('should return 0 for topics with no messages', () => {
      expect(getTopicTotalMessages([], 't1')).toBe(0);
    });
  });

  describe('getTopicBacklogCount', () => {
    it('should count unconsumed messages as backlog', () => {
      const messages = [
        { id: 'm1', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {} },
        { id: 'm2', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {} },
        { id: 'm3', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: { g1: true } },
      ];
      const groups = [{ id: 'g1', topicId: 't1' }];
      expect(getTopicBacklogCount(messages, 't1', groups)).toBe(2);
    });

    it('should not count fully consumed messages', () => {
      const messages = [
        { id: 'm1', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: { g1: true } },
      ];
      const groups = [{ id: 'g1', topicId: 't1' }];
      expect(getTopicBacklogCount(messages, 't1', groups)).toBe(0);
    });

    it('should count delayed messages as backlog', () => {
      const messages = [
        {
          id: 'm1',
          topicId: 't1',
          status: MESSAGE_STATUS.DELAYED,
          consumedBy: {},
          scheduledTime: Date.now() + 60000,
        },
      ];
      const groups = [{ id: 'g1', topicId: 't1' }];
      expect(getTopicBacklogCount(messages, 't1', groups)).toBe(1);
    });
  });

  describe('getConsumerGroupOffset', () => {
    it('should count messages consumed by the group', () => {
      const messages = [
        { id: 'm1', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: { g1: true } },
        { id: 'm2', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: { g1: true } },
        { id: 'm3', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {} },
      ];
      const group = { id: 'g1', topicId: 't1' };
      expect(getConsumerGroupOffset(group, messages)).toBe(2);
    });

    it('should return 0 when no messages consumed', () => {
      const messages = [
        { id: 'm1', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {} },
      ];
      const group = { id: 'g1', topicId: 't1' };
      expect(getConsumerGroupOffset(group, messages)).toBe(0);
    });
  });

  describe('getUnconsumedCount', () => {
    it('should count messages not consumed by group and not delayed', () => {
      const now = Date.now();
      const messages = [
        { id: 'm1', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: { g1: true } },
        { id: 'm2', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {} },
        { id: 'm3', topicId: 't1', status: MESSAGE_STATUS.DELAYED, consumedBy: {}, scheduledTime: now + 60000 },
        { id: 'm4', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {} },
      ];
      const group = { id: 'g1', topicId: 't1' };
      expect(getUnconsumedCount(group, messages, now)).toBe(2);
    });

    it('should count delayed-ready messages as unconsumed', () => {
      const now = Date.now();
      const messages = [
        { id: 'm1', topicId: 't1', status: MESSAGE_STATUS.DELAYED, consumedBy: {}, scheduledTime: now - 1000 },
      ];
      const group = { id: 'g1', topicId: 't1' };
      expect(getUnconsumedCount(group, messages, now)).toBe(1);
    });
  });

  describe('findNextMessageToConsume', () => {
    it('should find the first unconsumed message', () => {
      const now = Date.now();
      const messages = [
        { id: 'm1', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: { g1: true }, createdAt: 100 },
        { id: 'm2', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {}, createdAt: 200 },
        { id: 'm3', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {}, createdAt: 300 },
      ];
      const group = { id: 'g1', topicId: 't1' };
      expect(findNextMessageToConsume(group, messages, now).id).toBe('m2');
    });

    it('should return null when no messages available', () => {
      const messages = [
        { id: 'm1', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: { g1: true } },
      ];
      const group = { id: 'g1', topicId: 't1' };
      expect(findNextMessageToConsume(group, messages)).toBeNull();
    });

    it('should skip dead letter messages', () => {
      const messages = [
        { id: 'm1', topicId: 't1', status: MESSAGE_STATUS.DEAD_LETTER, consumedBy: {} },
      ];
      const group = { id: 'g1', topicId: 't1' };
      expect(findNextMessageToConsume(group, messages)).toBeNull();
    });

    it('should skip delayed messages not yet ready', () => {
      const now = Date.now();
      const messages = [
        { id: 'm1', topicId: 't1', status: MESSAGE_STATUS.DELAYED, consumedBy: {}, scheduledTime: now + 60000 },
      ];
      const group = { id: 'g1', topicId: 't1' };
      expect(findNextMessageToConsume(group, messages, now)).toBeNull();
    });
  });

  describe('simulateConsume', () => {
    it('should mark message as consumed by the group', () => {
      const messages = [
        { id: 'm1', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {} },
      ];
      const group = { id: 'g1', topicId: 't1' };
      const result = simulateConsume(group, messages);
      expect(result.consumed).toBe(true);
      expect(result.consumedMessageId).toBe('m1');
      expect(result.updatedMessages[0].consumedBy.g1).toBe(true);
    });

    it('should return consumed=false when no messages available', () => {
      const messages = [];
      const group = { id: 'g1', topicId: 't1' };
      const result = simulateConsume(group, messages);
      expect(result.consumed).toBe(false);
    });
  });

  describe('shouldMoveToDeadLetter', () => {
    it('should return true when retry count reaches max', () => {
      expect(shouldMoveToDeadLetter({ retryCount: 3 }, 3)).toBe(true);
      expect(shouldMoveToDeadLetter({ retryCount: 5 }, 3)).toBe(true);
    });

    it('should return false when retry count is below max', () => {
      expect(shouldMoveToDeadLetter({ retryCount: 2 }, 3)).toBe(false);
      expect(shouldMoveToDeadLetter({ retryCount: 0 }, 3)).toBe(false);
    });

    it('should use DEFAULT_MAX_RETRIES when maxRetries is not provided', () => {
      expect(shouldMoveToDeadLetter({ retryCount: DEFAULT_MAX_RETRIES }, null)).toBe(true);
      expect(shouldMoveToDeadLetter({ retryCount: DEFAULT_MAX_RETRIES - 1 }, undefined)).toBe(false);
    });
  });

  describe('simulateFailConsume', () => {
    it('should increment retry count', () => {
      const messages = [
        { id: 'm1', topicId: 't1', retryCount: 0, content: 'test' },
      ];
      const topics = [{ id: 't1', maxRetries: 3 }];
      const result = simulateFailConsume('m1', messages, topics);
      expect(result.updatedMessages[0].retryCount).toBe(1);
      expect(result.shouldDeadLetter).toBe(false);
    });

    it('should move to dead letter when max retries reached', () => {
      const messages = [
        { id: 'm1', topicId: 't1', retryCount: 2, content: 'test' },
      ];
      const topics = [{ id: 't1', maxRetries: 3 }];
      const result = simulateFailConsume('m1', messages, topics);
      expect(result.shouldDeadLetter).toBe(true);
      expect(result.deadLetter).toBeDefined();
      expect(result.deadLetter.topicId).toBe('t1');
      expect(result.deadLetter.retryCount).toBe(3);
      expect(result.deadLetter.content).toBe('test');
      expect(typeof result.deadLetter.failReason).toBe('string');
    });

    it('should return unchanged messages for non-existent message', () => {
      const messages = [{ id: 'm1', topicId: 't1', retryCount: 0 }];
      const result = simulateFailConsume('m999', messages, []);
      expect(result.updatedMessages).toEqual(messages);
      expect(result.shouldDeadLetter).toBe(false);
    });
  });

  describe('moveToDeadLetter', () => {
    it('should update message status to DEAD_LETTER', () => {
      const messages = [
        { id: 'm1', status: MESSAGE_STATUS.PENDING },
        { id: 'm2', status: MESSAGE_STATUS.PENDING },
      ];
      const existingDeadLetters = [{ id: 'd0', content: 'existing' }];
      const newDeadLetter = { id: 'd1', content: 'dead' };
      const result = moveToDeadLetter('m1', messages, [...existingDeadLetters, newDeadLetter]);
      expect(result.updatedMessages[0].status).toBe(MESSAGE_STATUS.DEAD_LETTER);
      expect(result.updatedMessages[1].status).toBe(MESSAGE_STATUS.PENDING);
      expect(result.updatedDeadLetters).toHaveLength(2);
    });
  });

  describe('requeueDeadLetter', () => {
    it('should remove dead letter and create new pending message', () => {
      const deadLetters = [
        { id: 'd1', topicId: 't1', content: 'requeue me', retryCount: 3 },
      ];
      const messages = [
        { id: 'm1', topicId: 't1', content: 'existing' },
      ];
      const result = requeueDeadLetter('d1', deadLetters, messages);
      expect(result.updatedDeadLetters).toHaveLength(0);
      expect(result.updatedMessages).toHaveLength(2);
      const requeued = result.updatedMessages.find((m) => m.content === 'requeue me');
      expect(requeued).toBeDefined();
      expect(requeued.status).toBe(MESSAGE_STATUS.PENDING);
      expect(requeued.retryCount).toBe(0);
      expect(requeued.consumedBy).toEqual({});
    });

    it('should return unchanged data for non-existent dead letter', () => {
      const deadLetters = [{ id: 'd1', topicId: 't1', content: 'test' }];
      const messages = [];
      const result = requeueDeadLetter('d999', deadLetters, messages);
      expect(result.updatedDeadLetters).toEqual(deadLetters);
      expect(result.updatedMessages).toEqual(messages);
    });
  });

  describe('deleteDeadLetter', () => {
    it('should remove the specified dead letter', () => {
      const deadLetters = [
        { id: 'd1', content: 'a' },
        { id: 'd2', content: 'b' },
      ];
      const result = deleteDeadLetter('d1', deadLetters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('d2');
    });
  });

  describe('createConsumerGroup', () => {
    it('should create a consumer group with valid inputs', () => {
      const group = createConsumerGroup('t1', 'group-a');
      expect(group).not.toBeNull();
      expect(group.topicId).toBe('t1');
      expect(group.name).toBe('group-a');
    });

    it('should return null for invalid inputs', () => {
      expect(createConsumerGroup(null, 'group')).toBeNull();
      expect(createConsumerGroup('t1', '')).toBeNull();
      expect(createConsumerGroup('t1', '   ')).toBeNull();
    });
  });

  describe('getTopicDeadLetters', () => {
    it('should filter dead letters by topic', () => {
      const deadLetters = [
        { id: 'd1', topicId: 't1' },
        { id: 'd2', topicId: 't2' },
        { id: 'd3', topicId: 't1' },
      ];
      expect(getTopicDeadLetters(deadLetters, 't1')).toHaveLength(2);
    });
  });

  describe('getBacklogByTopic', () => {
    it('should return backlog count per topic', () => {
      const topics = [{ id: 't1' }, { id: 't2' }];
      const messages = [
        { id: 'm1', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {} },
        { id: 'm2', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {} },
        { id: 'm3', topicId: 't2', status: MESSAGE_STATUS.PENDING, consumedBy: {} },
      ];
      const groups = [];
      const result = getBacklogByTopic(topics, messages, groups);
      expect(result.t1).toBe(2);
      expect(result.t2).toBe(1);
    });
  });

  describe('addBacklogDataPoint', () => {
    it('should add a new data point to history', () => {
      const history = [];
      const backlogs = { t1: 5 };
      const result = addBacklogDataPoint(history, backlogs, 1000);
      expect(result).toHaveLength(1);
      expect(result[0].timestamp).toBe(1000);
      expect(result[0].backlogs.t1).toBe(5);
    });

    it('should limit history to CHART_MAX_POINTS', () => {
      const history = Array.from({ length: 360 }, (_, i) => ({
        timestamp: i * 5000,
        backlogs: { t1: i },
      }));
      const backlogs = { t1: 100 };
      const result = addBacklogDataPoint(history, backlogs, 360 * 5000);
      expect(result.length).toBeLessThanOrEqual(360);
    });
  });

  describe('pruneOldBacklogHistory', () => {
    it('should remove data points older than 30 minutes', () => {
      const now = Date.now();
      const history = [
        { timestamp: now - 31 * 60 * 1000, backlogs: { t1: 1 } },
        { timestamp: now - 29 * 60 * 1000, backlogs: { t1: 2 } },
        { timestamp: now - 10 * 60 * 1000, backlogs: { t1: 3 } },
      ];
      const result = pruneOldBacklogHistory(history, now);
      expect(result).toHaveLength(2);
    });
  });

  describe('processDelayedMessages', () => {
    it('should change delayed messages to pending when ready', () => {
      const now = Date.now();
      const messages = [
        { id: 'm1', status: MESSAGE_STATUS.DELAYED, scheduledTime: now - 1000 },
        { id: 'm2', status: MESSAGE_STATUS.DELAYED, scheduledTime: now + 60000 },
        { id: 'm3', status: MESSAGE_STATUS.PENDING },
      ];
      const result = processDelayedMessages(messages, now);
      expect(result.changed).toBe(true);
      expect(result.updatedMessages[0].status).toBe(MESSAGE_STATUS.PENDING);
      expect(result.updatedMessages[1].status).toBe(MESSAGE_STATUS.DELAYED);
      expect(result.updatedMessages[2].status).toBe(MESSAGE_STATUS.PENDING);
    });

    it('should return changed=false when no delayed messages are ready', () => {
      const now = Date.now();
      const messages = [
        { id: 'm1', status: MESSAGE_STATUS.DELAYED, scheduledTime: now + 60000 },
      ];
      const result = processDelayedMessages(messages, now);
      expect(result.changed).toBe(false);
    });
  });

  describe('getTotalBacklog', () => {
    it('should sum backlog across all topics', () => {
      const topics = [{ id: 't1' }, { id: 't2' }];
      const messages = [
        { id: 'm1', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {} },
        { id: 'm2', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {} },
        { id: 'm3', topicId: 't2', status: MESSAGE_STATUS.PENDING, consumedBy: {} },
      ];
      const groups = [];
      expect(getTotalBacklog(topics, messages, groups)).toBe(3);
    });

    it('should return 0 when no topics', () => {
      expect(getTotalBacklog([], [], [])).toBe(0);
    });
  });

  describe('getTopicColor', () => {
    it('should return color from TOPIC_COLORS based on index', () => {
      expect(getTopicColor(0)).toBe(TOPIC_COLORS[0]);
      expect(getTopicColor(1)).toBe(TOPIC_COLORS[1]);
    });

    it('should wrap around when index exceeds array length', () => {
      const len = TOPIC_COLORS.length;
      expect(getTopicColor(len)).toBe(TOPIC_COLORS[0]);
      expect(getTopicColor(len + 1)).toBe(TOPIC_COLORS[1]);
    });
  });

  describe('consumer group offset advancement flow', () => {
    it('should advance offset after each consumption', () => {
      const messages = [
        { id: 'm1', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {}, createdAt: 100 },
        { id: 'm2', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {}, createdAt: 200 },
        { id: 'm3', topicId: 't1', status: MESSAGE_STATUS.PENDING, consumedBy: {}, createdAt: 300 },
      ];
      const group = { id: 'g1', topicId: 't1' };

      let currentMessages = messages;
      let offset = getConsumerGroupOffset(group, currentMessages);
      expect(offset).toBe(0);

      let result = simulateConsume(group, currentMessages);
      currentMessages = result.updatedMessages;
      offset = getConsumerGroupOffset(group, currentMessages);
      expect(offset).toBe(1);

      result = simulateConsume(group, currentMessages);
      currentMessages = result.updatedMessages;
      offset = getConsumerGroupOffset(group, currentMessages);
      expect(offset).toBe(2);

      result = simulateConsume(group, currentMessages);
      currentMessages = result.updatedMessages;
      offset = getConsumerGroupOffset(group, currentMessages);
      expect(offset).toBe(3);
    });
  });

  describe('dead letter retry flow', () => {
    it('should track retries and move to dead letter after max retries', () => {
      const messages = [
        { id: 'm1', topicId: 't1', retryCount: 0, content: 'test msg', status: MESSAGE_STATUS.PENDING, consumedBy: {} },
      ];
      const topics = [{ id: 't1', maxRetries: 3 }];

      let currentMessages = messages;
      let currentDeadLetters = [];

      for (let i = 0; i < 2; i++) {
        const failResult = simulateFailConsume('m1', currentMessages, topics);
        currentMessages = failResult.updatedMessages;
        expect(failResult.shouldDeadLetter).toBe(false);
      }

      const failResult = simulateFailConsume('m1', currentMessages, topics);
      expect(failResult.shouldDeadLetter).toBe(true);
      expect(failResult.deadLetter.retryCount).toBe(3);

      const moveResult = moveToDeadLetter('m1', failResult.updatedMessages, [...currentDeadLetters, failResult.deadLetter]);
      expect(moveResult.updatedMessages[0].status).toBe(MESSAGE_STATUS.DEAD_LETTER);
      expect(moveResult.updatedDeadLetters).toHaveLength(1);
    });
  });

  describe('message status transition', () => {
    it('should transition from pending to consuming to consumed as groups consume', () => {
      const groups = [
        { id: 'g1', topicId: 't1' },
        { id: 'g2', topicId: 't1' },
      ];
      let msg = { status: MESSAGE_STATUS.PENDING, topicId: 't1', consumedBy: {} };
      expect(getMessageEffectiveStatus(msg, groups)).toBe(MESSAGE_STATUS.PENDING);

      msg = { ...msg, consumedBy: { g1: true } };
      expect(getMessageEffectiveStatus(msg, groups)).toBe(MESSAGE_STATUS.CONSUMING);

      msg = { ...msg, consumedBy: { g1: true, g2: true } };
      expect(getMessageEffectiveStatus(msg, groups)).toBe(MESSAGE_STATUS.CONSUMED);
    });
  });
});
