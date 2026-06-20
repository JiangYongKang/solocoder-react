import { describe, it, expect, beforeEach } from 'vitest';
import {
  GROUP_BUYING_STATUS,
  SORT_TYPE,
  FAILED_REASON,
  COUNTDOWN_WARNING_THRESHOLD_MS,
  DEFAULT_AVATAR,
} from '@/pages/group-buying/constants.js';
import {
  generateId,
  padZero,
  formatPrice,
  calculateSavings,
  formatCountdown,
  formatCountdownString,
  isCountdownWarning,
  calculateProgressPercentage,
  isProgressComplete,
  isProgressNearComplete,
  getRemainingSpots,
  getGroupStatus,
  isGroupSuccess,
  isGroupFailed,
  isGroupOngoing,
  getGroupRemainingTime,
  getFailedReason,
  updateGroupStatus,
  sortGroups,
  compareGroupsByLatest,
  compareGroupsByTimeLeft,
  compareGroupsByMostPeople,
  canJoinGroup,
  hasUserJoinedGroup,
  isUserLeader,
  joinGroup,
  createGroup,
  hasUserOngoingGroup,
  getOngoingGroups,
  getUserGroups,
  getLedGroups,
  getJoinedGroups,
  formatDateTime,
  getProgressColor,
  getProductGroupStats,
  findJoinableGroup,
} from '@/pages/group-buying/utils.js';

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

function createMockGroup(overrides = {}) {
  const now = Date.now();
  return {
    id: 'g1',
    productId: 'p1',
    productName: '测试商品',
    productImage: 'test.jpg',
    totalPeople: 5,
    currentPeople: 2,
    groupPrice: 99,
    leaderId: 'u1',
    leaderName: '团长',
    leaderAvatar: DEFAULT_AVATAR,
    members: ['u1', 'u2'],
    membersInfo: [
      { userId: 'u1', name: '团长', avatar: DEFAULT_AVATAR, joinTime: now },
      { userId: 'u2', name: '成员2', avatar: DEFAULT_AVATAR, joinTime: now },
    ],
    status: GROUP_BUYING_STATUS.ONGOING,
    createdAt: now - 3600000,
    endTime: now + 7200000,
    ...overrides,
  };
}

describe('group-buying/utils', () => {
  describe('generateId', () => {
    it('should generate non-empty string ids', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique ids', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) ids.add(generateId());
      expect(ids.size).toBe(100);
    });
  });

  describe('padZero', () => {
    it('pads single digit numbers with leading zero', () => {
      expect(padZero(0)).toBe('00');
      expect(padZero(5)).toBe('05');
      expect(padZero(9)).toBe('09');
    });

    it('does not pad two digit numbers', () => {
      expect(padZero(10)).toBe('10');
      expect(padZero(99)).toBe('99');
    });

    it('handles numbers with more than two digits', () => {
      expect(padZero(100)).toBe('100');
    });
  });

  describe('formatPrice', () => {
    it('formats price as RMB with 2 decimals', () => {
      expect(formatPrice(99)).toBe('¥99.00');
      expect(formatPrice(99.9)).toBe('¥99.90');
      expect(formatPrice(0)).toBe('¥0.00');
    });

    it('handles null/undefined/NaN gracefully', () => {
      expect(formatPrice(null)).toBe('¥0.00');
      expect(formatPrice(undefined)).toBe('¥0.00');
      expect(formatPrice(NaN)).toBe('¥0.00');
    });

    it('handles string numbers', () => {
      expect(formatPrice('128.5')).toBe('¥128.50');
    });
  });

  describe('calculateSavings', () => {
    it('calculates savings correctly', () => {
      expect(calculateSavings(299, 159)).toBe(140);
      expect(calculateSavings(199, 89)).toBe(110);
    });

    it('returns 0 when group price is higher', () => {
      expect(calculateSavings(50, 100)).toBe(0);
    });

    it('handles zero values', () => {
      expect(calculateSavings(0, 0)).toBe(0);
      expect(calculateSavings(100, 0)).toBe(100);
    });

    it('handles invalid inputs', () => {
      expect(calculateSavings(null, 50)).toBe(0);
      expect(calculateSavings(100, undefined)).toBe(0);
      expect(calculateSavings('abc', 50)).toBe(0);
    });
  });

  describe('formatCountdown', () => {
    it('formats milliseconds to hours:minutes:seconds correctly', () => {
      const result = formatCountdown(3661000);
      expect(result.hours).toBe('01');
      expect(result.minutes).toBe('01');
      expect(result.seconds).toBe('01');
      expect(result.total).toBe(3661);
    });

    it('handles zero or negative milliseconds', () => {
      const result = formatCountdown(0);
      expect(result.hours).toBe('00');
      expect(result.minutes).toBe('00');
      expect(result.seconds).toBe('00');
      expect(result.total).toBe(0);

      const negResult = formatCountdown(-1000);
      expect(negResult.total).toBe(0);
    });

    it('pads single digits with zero', () => {
      const result = formatCountdown(3661000);
      expect(result.hours.length).toBe(2);
      expect(result.minutes.length).toBe(2);
      expect(result.seconds.length).toBe(2);
    });

    it('handles more than 24 hours', () => {
      const result = formatCountdown(25 * 3600 * 1000);
      expect(result.hours).toBe('25');
    });
  });

  describe('formatCountdownString', () => {
    it('returns formatted string', () => {
      expect(formatCountdownString(3661000)).toBe('01:01:01');
      expect(formatCountdownString(0)).toBe('00:00:00');
    });
  });

  describe('isCountdownWarning', () => {
    it('returns true when time is less than warning threshold', () => {
      expect(isCountdownWarning(COUNTDOWN_WARNING_THRESHOLD_MS - 1000)).toBe(true);
      expect(isCountdownWarning(1000)).toBe(true);
    });

    it('returns false when time is more than warning threshold', () => {
      expect(isCountdownWarning(COUNTDOWN_WARNING_THRESHOLD_MS + 1000)).toBe(false);
      expect(isCountdownWarning(2 * 60 * 60 * 1000)).toBe(false);
    });

    it('returns false for zero or negative time', () => {
      expect(isCountdownWarning(0)).toBe(false);
      expect(isCountdownWarning(-1000)).toBe(false);
    });
  });

  describe('calculateProgressPercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculateProgressPercentage(3, 10)).toBe(30);
      expect(calculateProgressPercentage(5, 10)).toBe(50);
      expect(calculateProgressPercentage(10, 10)).toBe(100);
    });

    it('caps at 100 percent', () => {
      expect(calculateProgressPercentage(15, 10)).toBe(100);
    });

    it('returns 0 for zero or negative values', () => {
      expect(calculateProgressPercentage(0, 10)).toBe(0);
      expect(calculateProgressPercentage(-5, 10)).toBe(0);
    });

    it('returns 0 when total is zero or negative', () => {
      expect(calculateProgressPercentage(5, 0)).toBe(0);
      expect(calculateProgressPercentage(5, -10)).toBe(0);
    });

    it('handles string inputs', () => {
      expect(calculateProgressPercentage('3', '10')).toBe(30);
    });
  });

  describe('isProgressComplete', () => {
    it('returns true when percentage is 100 or more', () => {
      expect(isProgressComplete(100)).toBe(true);
      expect(isProgressComplete(100.5)).toBe(true);
    });

    it('returns false when percentage is less than 100', () => {
      expect(isProgressComplete(99)).toBe(false);
      expect(isProgressComplete(0)).toBe(false);
    });
  });

  describe('isProgressNearComplete', () => {
    it('returns true when percentage is between warning threshold and 100', () => {
      expect(isProgressNearComplete(80)).toBe(true);
      expect(isProgressNearComplete(90)).toBe(true);
      expect(isProgressNearComplete(99)).toBe(true);
    });

    it('returns false when below warning threshold', () => {
      expect(isProgressNearComplete(50)).toBe(false);
      expect(isProgressNearComplete(0)).toBe(false);
    });

    it('returns false when at or above 100', () => {
      expect(isProgressNearComplete(100)).toBe(false);
      expect(isProgressNearComplete(101)).toBe(false);
    });
  });

  describe('getRemainingSpots', () => {
    it('calculates remaining spots correctly', () => {
      expect(getRemainingSpots(3, 10)).toBe(7);
      expect(getRemainingSpots(0, 10)).toBe(10);
      expect(getRemainingSpots(10, 10)).toBe(0);
    });

    it('returns 0 when current exceeds total', () => {
      expect(getRemainingSpots(15, 10)).toBe(0);
    });

    it('handles invalid inputs', () => {
      expect(getRemainingSpots(null, 10)).toBe(0);
      expect(getRemainingSpots(3, undefined)).toBe(0);
    });
  });

  describe('getGroupStatus', () => {
    const now = Date.now();

    it('returns ONGOING for active group', () => {
      const group = createMockGroup({
        status: GROUP_BUYING_STATUS.ONGOING,
        currentPeople: 2,
        totalPeople: 5,
        endTime: now + 3600000,
      });
      expect(getGroupStatus(group, now)).toBe(GROUP_BUYING_STATUS.ONGOING);
    });

    it('returns SUCCESS when currentPeople >= totalPeople', () => {
      const group = createMockGroup({
        status: GROUP_BUYING_STATUS.ONGOING,
        currentPeople: 5,
        totalPeople: 5,
        endTime: now + 3600000,
      });
      expect(getGroupStatus(group, now)).toBe(GROUP_BUYING_STATUS.SUCCESS);
    });

    it('returns FAILED when time is past endTime', () => {
      const group = createMockGroup({
        status: GROUP_BUYING_STATUS.ONGOING,
        currentPeople: 2,
        totalPeople: 5,
        endTime: now - 1000,
      });
      expect(getGroupStatus(group, now)).toBe(GROUP_BUYING_STATUS.FAILED);
    });

    it('returns SUCCESS if status is already SUCCESS', () => {
      const group = createMockGroup({
        status: GROUP_BUYING_STATUS.SUCCESS,
        currentPeople: 1,
        totalPeople: 5,
        endTime: now - 1000,
      });
      expect(getGroupStatus(group, now)).toBe(GROUP_BUYING_STATUS.SUCCESS);
    });

    it('returns FAILED if status is already FAILED', () => {
      const group = createMockGroup({
        status: GROUP_BUYING_STATUS.FAILED,
        currentPeople: 2,
        totalPeople: 5,
        endTime: now + 3600000,
      });
      expect(getGroupStatus(group, now)).toBe(GROUP_BUYING_STATUS.FAILED);
    });

    it('returns FAILED for null/undefined group', () => {
      expect(getGroupStatus(null, now)).toBe(GROUP_BUYING_STATUS.FAILED);
      expect(getGroupStatus(undefined, now)).toBe(GROUP_BUYING_STATUS.FAILED);
    });
  });

  describe('isGroupSuccess / isGroupFailed / isGroupOngoing', () => {
    const now = Date.now();

    it('isGroupSuccess returns true only for success groups', () => {
      const successGroup = createMockGroup({
        status: GROUP_BUYING_STATUS.SUCCESS,
      });
      expect(isGroupSuccess(successGroup, now)).toBe(true);

      const ongoingGroup = createMockGroup({
        status: GROUP_BUYING_STATUS.ONGOING,
        endTime: now + 3600000,
      });
      expect(isGroupSuccess(ongoingGroup, now)).toBe(false);
    });

    it('isGroupFailed returns true only for failed groups', () => {
      const failedGroup = createMockGroup({
        status: GROUP_BUYING_STATUS.FAILED,
      });
      expect(isGroupFailed(failedGroup, now)).toBe(true);

      const ongoingGroup = createMockGroup({
        status: GROUP_BUYING_STATUS.ONGOING,
        endTime: now + 3600000,
      });
      expect(isGroupFailed(ongoingGroup, now)).toBe(false);
    });

    it('isGroupOngoing returns true only for ongoing groups', () => {
      const ongoingGroup = createMockGroup({
        status: GROUP_BUYING_STATUS.ONGOING,
        endTime: now + 3600000,
      });
      expect(isGroupOngoing(ongoingGroup, now)).toBe(true);

      const successGroup = createMockGroup({
        status: GROUP_BUYING_STATUS.SUCCESS,
      });
      expect(isGroupOngoing(successGroup, now)).toBe(false);
    });
  });

  describe('getGroupRemainingTime', () => {
    const now = Date.now();

    it('returns remaining time correctly', () => {
      const group = createMockGroup({ endTime: now + 3600000 });
      expect(getGroupRemainingTime(group, now)).toBeCloseTo(3600000);
    });

    it('returns 0 when time is up', () => {
      const group = createMockGroup({ endTime: now - 1000 });
      expect(getGroupRemainingTime(group, now)).toBe(0);
    });

    it('returns 0 for null group', () => {
      expect(getGroupRemainingTime(null, now)).toBe(0);
    });
  });

  describe('getFailedReason', () => {
    const now = Date.now();

    it('returns timeout reason for expired unfilled group', () => {
      const group = createMockGroup({
        status: GROUP_BUYING_STATUS.ONGOING,
        currentPeople: 2,
        totalPeople: 5,
        endTime: now - 1000,
      });
      expect(getFailedReason(group, now)).toBe(FAILED_REASON.TIMEOUT);
    });

    it('returns existing failedReason if already set', () => {
      const group = createMockGroup({
        status: GROUP_BUYING_STATUS.FAILED,
        failedReason: '其他原因',
        endTime: now - 1000,
      });
      expect(getFailedReason(group, now)).toBe('其他原因');
    });

    it('returns empty string for non-failed group', () => {
      const group = createMockGroup({
        status: GROUP_BUYING_STATUS.ONGOING,
        endTime: now + 3600000,
      });
      expect(getFailedReason(group, now)).toBe('');
    });
  });

  describe('updateGroupStatus', () => {
    const now = Date.now();

    it('updates to SUCCESS when people reach target', () => {
      const group = createMockGroup({
        status: GROUP_BUYING_STATUS.ONGOING,
        currentPeople: 5,
        totalPeople: 5,
        endTime: now + 3600000,
      });
      const updated = updateGroupStatus(group, now);
      expect(updated.status).toBe(GROUP_BUYING_STATUS.SUCCESS);
      expect(updated.successTime).toBeTruthy();
    });

    it('updates to FAILED when time expires', () => {
      const group = createMockGroup({
        status: GROUP_BUYING_STATUS.ONGOING,
        currentPeople: 2,
        totalPeople: 5,
        endTime: now - 1000,
      });
      const updated = updateGroupStatus(group, now);
      expect(updated.status).toBe(GROUP_BUYING_STATUS.FAILED);
      expect(updated.failedTime).toBeTruthy();
      expect(updated.failedReason).toBe(FAILED_REASON.TIMEOUT);
    });

    it('does not change if status is same', () => {
      const group = createMockGroup({
        status: GROUP_BUYING_STATUS.ONGOING,
        currentPeople: 2,
        totalPeople: 5,
        endTime: now + 3600000,
      });
      const updated = updateGroupStatus(group, now);
      expect(updated).toBe(group);
    });

    it('returns original group for null input', () => {
      expect(updateGroupStatus(null, now)).toBeNull();
    });
  });

  describe('sortGroups and compare functions', () => {
    const now = Date.now();
    const groupA = createMockGroup({
      id: 'a',
      createdAt: now - 1000,
      currentPeople: 3,
      endTime: now + 7200000,
    });
    const groupB = createMockGroup({
      id: 'b',
      createdAt: now - 5000,
      currentPeople: 5,
      endTime: now + 3600000,
    });
    const groupC = createMockGroup({
      id: 'c',
      createdAt: now - 2000,
      currentPeople: 1,
      endTime: now + 1800000,
    });
    const groups = [groupA, groupB, groupC];

    it('sorts by latest (newest first', () => {
      const sorted = sortGroups(groups, SORT_TYPE.LATEST, now);
      expect(sorted[0].id).toBe('a');
      expect(sorted[1].id).toBe('c');
      expect(sorted[2].id).toBe('b');
    });

    it('sorts by time left (least time first)', () => {
      const sorted = sortGroups(groups, SORT_TYPE.TIME_LEFT, now);
      expect(sorted[0].id).toBe('c');
      expect(sorted[1].id).toBe('b');
      expect(sorted[2].id).toBe('a');
    });

    it('sorts by most people', () => {
      const sorted = sortGroups(groups, SORT_TYPE.MOST_PEOPLE, now);
      expect(sorted[0].id).toBe('b');
      expect(sorted[1].id).toBe('a');
      expect(sorted[2].id).toBe('c');
    });

    it('handles empty or non-array input', () => {
      expect(sortGroups([], SORT_TYPE.LATEST)).toEqual([]);
      expect(sortGroups(null, SORT_TYPE.LATEST)).toEqual([]);
      expect(sortGroups(undefined, SORT_TYPE.LATEST)).toEqual([]);
    });

    it('compareGroupsByLatest sorts by createdAt descending', () => {
      expect(compareGroupsByLatest(groupA, groupB)).toBeLessThan(0);
      expect(compareGroupsByLatest(groupB, groupA)).toBeGreaterThan(0);
    });

    it('compareGroupsByTimeLeft sorts by remaining time ascending', () => {
      expect(compareGroupsByTimeLeft(groupC, groupA, now)).toBeLessThan(0);
      expect(compareGroupsByTimeLeft(groupA, groupC, now)).toBeGreaterThan(0);
    });

    it('compareGroupsByMostPeople sorts by currentPeople descending', () => {
      expect(compareGroupsByMostPeople(groupB, groupA)).toBeLessThan(0);
      expect(compareGroupsByMostPeople(groupA, groupB)).toBeGreaterThan(0);
    });
  });

  describe('canJoinGroup', () => {
    const now = Date.now();

    it('returns true for eligible user', () => {
      const group = createMockGroup({
        status: GROUP_BUYING_STATUS.ONGOING,
        currentPeople: 2,
        totalPeople: 5,
        endTime: now + 3600000,
        members: ['u1', 'u2'],
      });
      expect(canJoinGroup(group, 'u3', now)).toBe(true);
    });

    it('returns false if user already joined', () => {
      const group = createMockGroup({
        status: GROUP_BUYING_STATUS.ONGOING,
        currentPeople: 2,
        totalPeople: 5,
        endTime: now + 3600000,
        members: ['u1', 'u2'],
      });
      expect(canJoinGroup(group, 'u1', now)).toBe(false);
      expect(canJoinGroup(group, 'u2', now)).toBe(false);
    });

    it('returns false if group is full', () => {
      const group = createMockGroup({
        status: GROUP_BUYING_STATUS.ONGOING,
        currentPeople: 5,
        totalPeople: 5,
        endTime: now + 3600000,
        members: ['u1', 'u2', 'u3', 'u4', 'u5'],
      });
      expect(canJoinGroup(group, 'u6', now)).toBe(false);
    });

    it('returns false if group is not ongoing', () => {
      const successGroup = createMockGroup({
        status: GROUP_BUYING_STATUS.SUCCESS,
        currentPeople: 5,
        totalPeople: 5,
      });
      expect(canJoinGroup(successGroup, 'u3', now)).toBe(false);

      const failedGroup = createMockGroup({
        status: GROUP_BUYING_STATUS.FAILED,
      });
      expect(canJoinGroup(failedGroup, 'u3', now)).toBe(false);
    });

    it('returns false for null/empty inputs', () => {
      expect(canJoinGroup(null, 'u1', now)).toBe(false);
      expect(canJoinGroup(createMockGroup(), '', now)).toBe(false);
      expect(canJoinGroup(createMockGroup(), null, now)).toBe(false);
    });
  });

  describe('hasUserJoinedGroup', () => {
    it('returns true for leader', () => {
      const group = createMockGroup({ leaderId: 'u1' });
      expect(hasUserJoinedGroup(group, 'u1')).toBe(true);
    });

    it('returns true for member', () => {
      const group = createMockGroup({ members: ['u1', 'u2'] });
      expect(hasUserJoinedGroup(group, 'u2')).toBe(true);
    });

    it('returns false for non-member', () => {
      const group = createMockGroup({ leaderId: 'u1', members: ['u1', 'u2'] });
      expect(hasUserJoinedGroup(group, 'u3')).toBe(false);
    });

    it('handles null inputs', () => {
      expect(hasUserJoinedGroup(null, 'u1')).toBe(false);
      expect(hasUserJoinedGroup(createMockGroup(), '')).toBe(false);
    });
  });

  describe('isUserLeader', () => {
    it('returns true for leader', () => {
      const group = createMockGroup({ leaderId: 'u1' });
      expect(isUserLeader(group, 'u1')).toBe(true);
    });

    it('returns false for non-leader', () => {
      const group = createMockGroup({ leaderId: 'u1' });
      expect(isUserLeader(group, 'u2')).toBe(false);
    });

    it('handles null inputs', () => {
      expect(isUserLeader(null, 'u1')).toBe(false);
      expect(isUserLeader(createMockGroup(), '')).toBe(false);
    });
  });

  describe('joinGroup', () => {
    const now = Date.now();

    it('successfully joins a group', () => {
      const group = createMockGroup({
      currentPeople: 2,
      totalPeople: 5,
      endTime: now + 3600000,
      members: ['u1', 'u2'],
    });
      const result = joinGroup(group, 'u3', '新成员', DEFAULT_AVATAR, now);
      expect(result.success).toBe(true);
      expect(result.group.currentPeople).toBe(3);
      expect(result.group.members).toContain('u3');
      expect(result.group.membersInfo.length).toBe(3);
    });

    it('returns failure if cannot join', () => {
      const group = createMockGroup({
        currentPeople: 5,
        totalPeople: 5,
        endTime: now + 3600000,
        members: ['u1', 'u2', 'u3', 'u4', 'u5'],
      });
      const result = joinGroup(group, 'u6', '新成员', DEFAULT_AVATAR, now);
      expect(result.success).toBe(false);
      expect(result.group).toBe(group);
    });

    it('updates status to success if group becomes full', () => {
      const group = createMockGroup({
        status: GROUP_BUYING_STATUS.ONGOING,
        currentPeople: 4,
        totalPeople: 5,
        endTime: now + 3600000,
        members: ['u1', 'u2', 'u3', 'u4'],
      });
      const result = joinGroup(group, 'u5', '新成员', DEFAULT_AVATAR, now);
      expect(result.success).toBe(true);
      expect(result.group.status).toBe(GROUP_BUYING_STATUS.SUCCESS);
      expect(result.group.successTime).toBeTruthy();
    });
  });

  describe('createGroup', () => {
    const now = Date.now();

    it('creates a new group with correct initial values', () => {
      const group = createGroup(
        'p1',
        '测试商品',
        'test.jpg',
        5,
        99,
        'u1',
        '团长',
        DEFAULT_AVATAR,
        7200000,
        now
      );

      expect(group.id).toBeTruthy();
      expect(group.productId).toBe('p1');
      expect(group.totalPeople).toBe(5);
      expect(group.currentPeople).toBe(1);
      expect(group.groupPrice).toBe(99);
      expect(group.leaderId).toBe('u1');
      expect(group.leaderName).toBe('团长');
      expect(group.status).toBe(GROUP_BUYING_STATUS.ONGOING);
      expect(group.members).toEqual(['u1']);
      expect(group.membersInfo.length).toBe(1);
      expect(group.createdAt).toBe(now);
      expect(group.endTime).toBe(now + 7200000);
    });

    it('uses default values for missing name/avatar', () => {
      const group = createGroup(
        'p1',
        '测试商品',
        'test.jpg',
        5,
        99,
        'u1',
        '',
        '',
        7200000,
        now
      );
      expect(group.leaderName).toBe('匿名用户');
      expect(group.leaderAvatar).toBe(DEFAULT_AVATAR);
    });
  });

  describe('hasUserOngoingGroup', () => {
    const now = Date.now();

    it('returns true if user has ongoing group', () => {
      const groups = [
        createMockGroup({
        id: 'g1',
        productId: 'p1',
        leaderId: 'u1',
        members: ['u1'],
        status: GROUP_BUYING_STATUS.ONGOING,
        endTime: now + 3600000,
      }),
      ];
      expect(hasUserOngoingGroup(groups, 'u1', 'p1', now)).toBe(true);
    });

    it('returns false if no ongoing group for product', () => {
      const groups = [
        createMockGroup({
        id: 'g1',
        productId: 'p1',
        leaderId: 'u1',
        members: ['u1'],
        status: GROUP_BUYING_STATUS.SUCCESS,
      }),
      ];
      expect(hasUserOngoingGroup(groups, 'u1', 'p1', now)).toBe(false);
    });

    it('returns false for different product', () => {
      const groups = [
        createMockGroup({
        id: 'g1',
        productId: 'p2',
        leaderId: 'u1',
        members: ['u1'],
        status: GROUP_BUYING_STATUS.ONGOING,
        endTime: now + 3600000,
      }),
      ];
      expect(hasUserOngoingGroup(groups, 'u1', 'p1', now)).toBe(false);
    });

    it('handles invalid inputs', () => {
      expect(hasUserOngoingGroup(null, 'u1', 'p1', now)).toBe(false);
      expect(hasUserOngoingGroup([], 'u1', 'p1', now)).toBe(false);
      expect(hasUserOngoingGroup([], '', 'p1', now)).toBe(false);
    });
  });

  describe('getOngoingGroups', () => {
    const now = Date.now();

    it('filters ongoing groups by productId', () => {
      const groups = [
        createMockGroup({ id: 'g1', productId: 'p1', status: GROUP_BUYING_STATUS.ONGOING, endTime: now + 3600000 }),
        createMockGroup({ id: 'g2', productId: 'p1', status: GROUP_BUYING_STATUS.SUCCESS }),
        createMockGroup({ id: 'g3', productId: 'p2', status: GROUP_BUYING_STATUS.ONGOING, endTime: now + 3600000 }),
      ];
      const result = getOngoingGroups(groups, 'p1', now);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('g1');
    });

    it('handles empty or null input', () => {
      expect(getOngoingGroups([], 'p1', now)).toEqual([]);
      expect(getOngoingGroups(null, 'p1', now)).toEqual([]);
    });
  });

  describe('getUserGroups / getLedGroups / getJoinedGroups', () => {
    const groups = [
      createMockGroup({ id: 'g1', leaderId: 'u1', members: ['u1', 'u2'] }),
      createMockGroup({ id: 'g2', leaderId: 'u2', members: ['u2', 'u3'] }),
      createMockGroup({ id: 'g3', leaderId: 'u3', members: ['u3'] }),
    ];

    it('getUserGroups returns all groups user joined', () => {
      const result = getUserGroups(groups, 'u2');
      expect(result.length).toBe(2);
      expect(result.map((g) => g.id)).toEqual(expect.arrayContaining(['g1', 'g2']));
    });

    it('getLedGroups returns groups user leads', () => {
      const result = getLedGroups(groups, 'u1');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('g1');
    });

    it('getJoinedGroups returns groups user joined but not leading', () => {
      const result = getJoinedGroups(groups, 'u2');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('g1');
    });

    it('handles empty/null inputs', () => {
      expect(getUserGroups([], 'u1')).toEqual([]);
      expect(getUserGroups(null, 'u1')).toEqual([]);
      expect(getLedGroups([], 'u1')).toEqual([]);
      expect(getJoinedGroups([], 'u1')).toEqual([]);
    });
  });

  describe('formatDateTime', () => {
    it('formats timestamp to readable string', () => {
      const s = formatDateTime(1700000000000);
      expect(s).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it('handles falsy values', () => {
      expect(formatDateTime(0)).toBe('');
      expect(formatDateTime(null)).toBe('');
      expect(formatDateTime(undefined)).toBe('');
    });
  });

  describe('getProgressColor', () => {
    it('returns green for complete progress', () => {
      expect(getProgressColor(100)).toBe('#52c41a');
      expect(getProgressColor(120)).toBe('#52c41a');
    });

    it('returns yellow for near complete progress', () => {
      expect(getProgressColor(80)).toBe('#faad14');
      expect(getProgressColor(90)).toBe('#faad14');
    });

    it('returns blue for normal progress', () => {
      expect(getProgressColor(50)).toBe('#1890ff');
      expect(getProgressColor(0)).toBe('#1890ff');
    });
  });
});

describe('group-buying/storage', () => {
  let storage;
  beforeEach(() => {
    storage = createMockStorage();
  });

  it('saveGroups and loadGroups round-trip', async () => {
    const { saveGroups, loadGroups } = await import('@/pages/group-buying/storage.js');
    const testGroups = [{ id: 'g1', name: 'test' }];
    saveGroups(testGroups, storage);
    const loaded = loadGroups(storage);
    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe('g1');
  });

  it('loadGroups defaults to empty array', async () => {
    const { loadGroups } = await import('@/pages/group-buying/storage.js');
    expect(loadGroups(storage)).toEqual([]);
  });

  it('saveCurrentUser and loadCurrentUser round-trip', async () => {
    const { saveCurrentUser, loadCurrentUser } = await import('@/pages/group-buying/storage.js');
    const user = { id: 'u1', name: 'test' };
    saveCurrentUser(user, storage);
    const loaded = loadCurrentUser(storage);
    expect(loaded.id).toBe('u1');
    expect(loaded.name).toBe('test');
  });

  it('loadCurrentUser returns null when not set', async () => {
    const { loadCurrentUser } = await import('@/pages/group-buying/storage.js');
    expect(loadCurrentUser(storage)).toBeNull();
  });

  it('handles corrupted JSON gracefully', async () => {
    const { loadGroups } = await import('@/pages/group-buying/storage.js');
    storage.setItem('group_buying_groups', '{bad json');
    expect(loadGroups(storage)).toEqual([]);
  });

  it('does not throw when storage is null', async () => {
    const { saveGroups, loadGroups } = await import('@/pages/group-buying/storage.js');
    expect(() => saveGroups([], null)).not.toThrow();
    expect(() => loadGroups(null)).not.toThrow();
  });
});

describe('group-buying/utils - product stats and joinable group', () => {
  const now = Date.now();

  describe('getProductGroupStats', () => {
    it('returns zero stats for empty/invalid inputs', () => {
      const emptyResult = getProductGroupStats([], 'p1', 5, now);
      expect(emptyResult.totalGroups).toBe(0);
      expect(emptyResult.ongoingGroups).toBe(0);
      expect(emptyResult.successGroups).toBe(0);
      expect(emptyResult.totalJoinedPeople).toBe(0);
      expect(emptyResult.averageProgress).toBe(0);
      expect(emptyResult.bestProgress).toBe(0);
      expect(emptyResult.bestGroup).toBeNull();

      const nullResult = getProductGroupStats(null, 'p1', 5, now);
      expect(nullResult.totalGroups).toBe(0);

      const noIdResult = getProductGroupStats([], '', 5, now);
      expect(noIdResult.totalGroups).toBe(0);

      const noSizeResult = getProductGroupStats([], 'p1', 0, now);
      expect(noSizeResult.totalGroups).toBe(0);
    });

    it('aggregates stats for ongoing groups correctly', () => {
      const groups = [
        createMockGroup({
          id: 'g1', productId: 'p1', totalPeople: 5, currentPeople: 2,
          status: GROUP_BUYING_STATUS.ONGOING, endTime: now + 3600000,
        }),
        createMockGroup({
          id: 'g2', productId: 'p1', totalPeople: 5, currentPeople: 4,
          status: GROUP_BUYING_STATUS.ONGOING, endTime: now + 3600000,
        }),
        createMockGroup({
          id: 'g3', productId: 'p1', totalPeople: 5, currentPeople: 1,
          status: GROUP_BUYING_STATUS.ONGOING, endTime: now + 3600000,
        }),
      ];
      const stats = getProductGroupStats(groups, 'p1', 5, now);

      expect(stats.totalGroups).toBe(3);
      expect(stats.ongoingGroups).toBe(3);
      expect(stats.successGroups).toBe(0);
      expect(stats.failedGroups).toBe(0);
      expect(stats.totalJoinedPeople).toBe(2 + 4 + 1);
      expect(stats.aggregateCurrentPeople).toBe(7);
      expect(stats.aggregateTotalPeople).toBe(15);
      expect(stats.averageProgress).toBeCloseTo(46.67);
      expect(stats.bestProgress).toBe(80);
      expect(stats.bestGroup.id).toBe('g2');
    });

    it('counts success groups correctly', () => {
      const groups = [
        createMockGroup({
          id: 'g1', productId: 'p1', totalPeople: 5, currentPeople: 5,
          status: GROUP_BUYING_STATUS.SUCCESS, successTime: now,
          endTime: now + 3600000,
        }),
        createMockGroup({
          id: 'g2', productId: 'p1', totalPeople: 5, currentPeople: 3,
          status: GROUP_BUYING_STATUS.ONGOING, endTime: now + 3600000,
        }),
      ];
      const stats = getProductGroupStats(groups, 'p1', 5, now);

      expect(stats.totalGroups).toBe(2);
      expect(stats.successGroups).toBe(1);
      expect(stats.ongoingGroups).toBe(1);
      expect(stats.bestProgress).toBe(100);
    });

    it('excludes failed groups from aggregate counts', () => {
      const groups = [
        createMockGroup({
          id: 'g1', productId: 'p1', totalPeople: 5, currentPeople: 2,
          status: GROUP_BUYING_STATUS.FAILED, failedReason: FAILED_REASON.TIMEOUT,
          failedTime: now, endTime: now - 1000,
        }),
        createMockGroup({
          id: 'g2', productId: 'p1', totalPeople: 5, currentPeople: 3,
          status: GROUP_BUYING_STATUS.ONGOING, endTime: now + 3600000,
        }),
      ];
      const stats = getProductGroupStats(groups, 'p1', 5, now);

      expect(stats.totalGroups).toBe(2);
      expect(stats.failedGroups).toBe(1);
      expect(stats.ongoingGroups).toBe(1);
      expect(stats.aggregateCurrentPeople).toBe(3);
      expect(stats.aggregateTotalPeople).toBe(5);
    });

    it('filters by productId', () => {
      const groups = [
        createMockGroup({
          id: 'g1', productId: 'p1', totalPeople: 5, currentPeople: 2,
          status: GROUP_BUYING_STATUS.ONGOING, endTime: now + 3600000,
        }),
        createMockGroup({
          id: 'g2', productId: 'p2', totalPeople: 10, currentPeople: 5,
          status: GROUP_BUYING_STATUS.ONGOING, endTime: now + 3600000,
        }),
      ];

      const statsP1 = getProductGroupStats(groups, 'p1', 5, now);
      expect(statsP1.totalGroups).toBe(1);
      expect(statsP1.totalJoinedPeople).toBe(2);

      const statsP2 = getProductGroupStats(groups, 'p2', 10, now);
      expect(statsP2.totalGroups).toBe(1);
      expect(statsP2.totalJoinedPeople).toBe(5);
    });
  });

  describe('findJoinableGroup', () => {
    it('returns null for invalid inputs', () => {
      expect(findJoinableGroup(null, 'p1', 'u1', now)).toBeNull();
      expect(findJoinableGroup([], '', 'u1', now)).toBeNull();
      expect(findJoinableGroup([], 'p1', '', now)).toBeNull();
    });

    it('returns null when no joinable group exists', () => {
      const groups = [
        createMockGroup({
          id: 'g1', productId: 'p1', totalPeople: 5, currentPeople: 5,
          status: GROUP_BUYING_STATUS.ONGOING,
          members: ['u2', 'u3', 'u4', 'u5', 'u6'],
          endTime: now + 3600000,
        }),
        createMockGroup({
          id: 'g2', productId: 'p2', totalPeople: 5, currentPeople: 2,
          status: GROUP_BUYING_STATUS.ONGOING,
          members: ['u2', 'u3'],
          endTime: now + 3600000,
        }),
      ];
      expect(findJoinableGroup(groups, 'p1', 'u1', now)).toBeNull();
    });

    it('returns the group with fewest remaining spots (nearest to complete)', () => {
      const groups = [
        createMockGroup({
          id: 'g1', productId: 'p1', totalPeople: 5, currentPeople: 2,
          status: GROUP_BUYING_STATUS.ONGOING,
          members: ['u10', 'u11'],
          endTime: now + 3600000,
        }),
        createMockGroup({
          id: 'g2', productId: 'p1', totalPeople: 5, currentPeople: 4,
          status: GROUP_BUYING_STATUS.ONGOING,
          members: ['u20', 'u21', 'u22', 'u23'],
          endTime: now + 3600000,
        }),
        createMockGroup({
          id: 'g3', productId: 'p1', totalPeople: 5, currentPeople: 3,
          status: GROUP_BUYING_STATUS.ONGOING,
          members: ['u30', 'u31', 'u32'],
          endTime: now + 3600000,
        }),
      ];
      const found = findJoinableGroup(groups, 'p1', 'u1', now);
      expect(found).not.toBeNull();
      expect(found.id).toBe('g2');
    });

    it('excludes groups that user already joined', () => {
      const groups = [
        createMockGroup({
          id: 'g1', productId: 'p1', totalPeople: 5, currentPeople: 4,
          status: GROUP_BUYING_STATUS.ONGOING,
          members: ['u1', 'u11', 'u12', 'u13'],
          leaderId: 'u1',
          endTime: now + 3600000,
        }),
        createMockGroup({
          id: 'g2', productId: 'p1', totalPeople: 5, currentPeople: 2,
          status: GROUP_BUYING_STATUS.ONGOING,
          members: ['u20', 'u21'],
          endTime: now + 3600000,
        }),
      ];
      const found = findJoinableGroup(groups, 'p1', 'u1', now);
      expect(found).not.toBeNull();
      expect(found.id).toBe('g2');
    });

    it('excludes groups from different products', () => {
      const groups = [
        createMockGroup({
          id: 'g1', productId: 'p2', totalPeople: 5, currentPeople: 4,
          status: GROUP_BUYING_STATUS.ONGOING,
          members: ['u20', 'u21', 'u22', 'u23'],
          endTime: now + 3600000,
        }),
        createMockGroup({
          id: 'g2', productId: 'p1', totalPeople: 5, currentPeople: 2,
          status: GROUP_BUYING_STATUS.ONGOING,
          members: ['u10', 'u11'],
          endTime: now + 3600000,
        }),
      ];
      const found = findJoinableGroup(groups, 'p1', 'u1', now);
      expect(found.id).toBe('g2');
    });
  });
});
