import {
  GROUP_BUYING_STATUS,
  SORT_TYPE,
  FAILED_REASON,
  PROGRESS_COMPLETE_THRESHOLD,
  PROGRESS_WARNING_THRESHOLD,
  COUNTDOWN_WARNING_THRESHOLD_MS,
  DEFAULT_AVATAR,
} from './constants.js'

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

export function padZero(num) {
  return String(num).padStart(2, '0')
}

export function formatPrice(price) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return '¥0.00'
  return `¥${Number(price).toFixed(2)}`
}

export function calculateSavings(originalPrice, groupPrice) {
  if (originalPrice === null || originalPrice === undefined) return 0
  if (groupPrice === null || groupPrice === undefined) return 0
  const original = Number(originalPrice)
  const group = Number(groupPrice)
  if (Number.isNaN(original) || Number.isNaN(group)) return 0
  return Math.max(0, original - group)
}

export function formatCountdown(ms) {
  if (ms <= 0) {
    return { hours: '00', minutes: '00', seconds: '00', total: 0 }
  }
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return {
    hours: padZero(hours),
    minutes: padZero(minutes),
    seconds: padZero(seconds),
    total: totalSeconds,
  }
}

export function formatCountdownString(ms) {
  const { hours, minutes, seconds } = formatCountdown(ms)
  return `${hours}:${minutes}:${seconds}`
}

export function isCountdownWarning(ms) {
  return ms > 0 && ms < COUNTDOWN_WARNING_THRESHOLD_MS
}

export function calculateProgressPercentage(currentPeople, totalPeople) {
  if (currentPeople === null || currentPeople === undefined) return 0
  if (totalPeople === null || totalPeople === undefined) return 0
  const current = Number(currentPeople)
  const total = Number(totalPeople)
  if (Number.isNaN(current) || Number.isNaN(total)) return 0
  if (total <= 0) return 0
  if (current <= 0) return 0
  const percentage = (current / total) * 100
  return Math.min(PROGRESS_COMPLETE_THRESHOLD, Math.round(percentage * 100) / 100)
}

export function isProgressComplete(percentage) {
  return percentage >= PROGRESS_COMPLETE_THRESHOLD
}

export function isProgressNearComplete(percentage) {
  return percentage >= PROGRESS_WARNING_THRESHOLD && percentage < PROGRESS_COMPLETE_THRESHOLD
}

export function getRemainingSpots(currentPeople, totalPeople) {
  if (currentPeople === null || currentPeople === undefined) return 0
  if (totalPeople === null || totalPeople === undefined) return 0
  const current = Number(currentPeople)
  const total = Number(totalPeople)
  if (Number.isNaN(current) || Number.isNaN(total)) return 0
  return Math.max(0, total - current)
}

export function getGroupStatus(group, now = Date.now()) {
  if (!group) return GROUP_BUYING_STATUS.FAILED

  if (group.status === GROUP_BUYING_STATUS.SUCCESS) {
    return GROUP_BUYING_STATUS.SUCCESS
  }
  if (group.status === GROUP_BUYING_STATUS.FAILED) {
    return GROUP_BUYING_STATUS.FAILED
  }

  if (group.currentPeople >= group.totalPeople) {
    return GROUP_BUYING_STATUS.SUCCESS
  }

  if (now > group.endTime) {
    return GROUP_BUYING_STATUS.FAILED
  }

  return GROUP_BUYING_STATUS.ONGOING
}

export function isGroupSuccess(group, now = Date.now()) {
  return getGroupStatus(group, now) === GROUP_BUYING_STATUS.SUCCESS
}

export function isGroupFailed(group, now = Date.now()) {
  return getGroupStatus(group, now) === GROUP_BUYING_STATUS.FAILED
}

export function isGroupOngoing(group, now = Date.now()) {
  return getGroupStatus(group, now) === GROUP_BUYING_STATUS.ONGOING
}

export function getGroupRemainingTime(group, now = Date.now()) {
  if (!group) return 0
  return Math.max(0, group.endTime - now)
}

export function getFailedReason(group, now = Date.now()) {
  if (!isGroupFailed(group, now)) return ''
  if (group.failedReason) return group.failedReason
  if (now > group.endTime && group.currentPeople < group.totalPeople) {
    return FAILED_REASON.TIMEOUT
  }
  return ''
}

export function updateGroupStatus(group, now = Date.now()) {
  if (!group) return group

  const newStatus = getGroupStatus(group, now)

  if (newStatus === group.status) return group

  const updated = { ...group, status: newStatus }

  if (newStatus === GROUP_BUYING_STATUS.SUCCESS) {
    updated.successTime = now
  } else if (newStatus === GROUP_BUYING_STATUS.FAILED) {
    updated.failedTime = now
    updated.failedReason = getFailedReason(group, now)
  }

  return updated
}

export function sortGroups(groups, sortType, now = Date.now()) {
  if (!Array.isArray(groups)) return []

  const sorted = [...groups]

  switch (sortType) {
    case SORT_TYPE.LATEST:
      sorted.sort((a, b) => b.createdAt - a.createdAt)
      break
    case SORT_TYPE.TIME_LEFT:
      sorted.sort((a, b) => {
        const timeA = getGroupRemainingTime(a, now)
        const timeB = getGroupRemainingTime(b, now)
        return timeA - timeB
      })
      break
    case SORT_TYPE.MOST_PEOPLE:
      sorted.sort((a, b) => b.currentPeople - a.currentPeople)
      break
    default:
      break
  }

  return sorted
}

export function compareGroupsByLatest(a, b) {
  return b.createdAt - a.createdAt
}

export function compareGroupsByTimeLeft(a, b, now = Date.now()) {
  const timeA = getGroupRemainingTime(a, now)
  const timeB = getGroupRemainingTime(b, now)
  return timeA - timeB
}

export function compareGroupsByMostPeople(a, b) {
  return b.currentPeople - a.currentPeople
}

export function canJoinGroup(group, userId, now = Date.now()) {
  if (!group || !userId) return false
  if (!isGroupOngoing(group, now)) return false
  if (group.currentPeople >= group.totalPeople) return false
  if (group.members && group.members.includes(userId)) return false
  return true
}

export function hasUserJoinedGroup(group, userId) {
  if (!group || !userId) return false
  if (group.leaderId === userId) return true
  if (group.members && group.members.includes(userId)) return true
  return false
}

export function isUserLeader(group, userId) {
  if (!group || !userId) return false
  return group.leaderId === userId
}

export function joinGroup(group, userId, userName, userAvatar, now = Date.now()) {
  if (!canJoinGroup(group, userId, now)) {
    return { success: false, group }
  }

  const newMembers = [...(group.members || []), userId]
  const newMembersInfo = [...(group.membersInfo || [])]
  if (userName || userAvatar) {
    newMembersInfo.push({
      userId,
      name: userName || '',
      avatar: userAvatar || DEFAULT_AVATAR,
      joinTime: now,
    })
  }

  let updatedGroup = {
    ...group,
    members: newMembers,
    membersInfo: newMembersInfo,
    currentPeople: group.currentPeople + 1,
  }

  updatedGroup = updateGroupStatus(updatedGroup, now)

  return { success: true, group: updatedGroup }
}

export function createGroup(productId, productName, productImage, groupSize, groupPrice, leaderId, leaderName, leaderAvatar, durationMs, now = Date.now()) {
  const groupId = generateId()
  const endTime = now + durationMs

  const group = {
    id: groupId,
    productId,
    productName,
    productImage,
    totalPeople: groupSize,
    currentPeople: 1,
    groupPrice,
    leaderId,
    leaderName: leaderName || '匿名用户',
    leaderAvatar: leaderAvatar || DEFAULT_AVATAR,
    members: [leaderId],
    membersInfo: [
      {
        userId: leaderId,
        name: leaderName || '匿名用户',
        avatar: leaderAvatar || DEFAULT_AVATAR,
        joinTime: now,
      },
    ],
    status: GROUP_BUYING_STATUS.ONGOING,
    createdAt: now,
    endTime,
  }

  return group
}

export function hasUserOngoingGroup(groups, userId, productId, now = Date.now()) {
  if (!Array.isArray(groups) || !userId) return false

  return groups.some((group) => {
    if (group.productId !== productId) return false
    if (!hasUserJoinedGroup(group, userId)) return false
    return isGroupOngoing(group, now)
  })
}

export function getOngoingGroups(groups, productId, now = Date.now()) {
  if (!Array.isArray(groups)) return []
  return groups.filter(
    (group) => group.productId === productId && isGroupOngoing(group, now)
  )
}

export function getUserGroups(groups, userId) {
  if (!Array.isArray(groups) || !userId) return []
  return groups.filter((group) => hasUserJoinedGroup(group, userId))
}

export function getLedGroups(groups, userId) {
  if (!Array.isArray(groups) || !userId) return []
  return groups.filter((group) => isUserLeader(group, userId))
}

export function getJoinedGroups(groups, userId) {
  if (!Array.isArray(groups) || !userId) return []
  return groups.filter(
    (group) => hasUserJoinedGroup(group, userId) && !isUserLeader(group, userId)
  )
}

export function formatDateTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = padZero(date.getMonth() + 1)
  const day = padZero(date.getDate())
  const hours = padZero(date.getHours())
  const minutes = padZero(date.getMinutes())
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function simulateNewGroup(groups, products, now = Date.now()) {
  if (!Array.isArray(groups) || !products || products.length === 0) {
    return groups
  }

  const product = products[Math.floor(Math.random() * products.length)]
  const randomNames = ['小明', '小红', '小刚', '小丽', '阿强', '阿美', '老王', '小李']
  const leaderName = randomNames[Math.floor(Math.random() * randomNames.length)]
  const durationMs = Math.random() * 2 * 60 * 60 * 1000 + 30 * 60 * 1000

  const newGroup = createGroup(
    product.id,
    product.name,
    product.image,
    product.groupSize,
    product.groupPrice,
    generateId(),
    leaderName,
    DEFAULT_AVATAR,
    durationMs,
    now
  )

  return [...groups, newGroup]
}

export function simulateGroupUpdate(group, now = Date.now()) {
  if (!group || !isGroupOngoing(group, now)) return group

  if (Math.random() > 0.3) return group

  const remainingSpots = getRemainingSpots(group.currentPeople, group.totalPeople)
  if (remainingSpots <= 0) return group

  const addCount = Math.min(remainingSpots, Math.floor(Math.random() * 2) + 1)

  const randomNames = ['路人甲', '路人乙', '路人丙', '路人丁', '访客A', '访客B']
  const newMembers = [...(group.members || [])]
  const newMembersInfo = [...(group.membersInfo || [])]

  for (let i = 0; i < addCount; i++) {
    const userId = generateId()
    const name = randomNames[Math.floor(Math.random() * randomNames.length)]
    newMembers.push(userId)
    newMembersInfo.push({
      userId,
      name,
      avatar: DEFAULT_AVATAR,
      joinTime: now,
    })
  }

  let updatedGroup = {
    ...group,
    members: newMembers,
    membersInfo: newMembersInfo,
    currentPeople: group.currentPeople + addCount,
  }

  updatedGroup = updateGroupStatus(updatedGroup, now)

  return updatedGroup
}

export function simulateGroupsUpdate(groups, now = Date.now()) {
  if (!Array.isArray(groups)) return []
  return groups.map((group) => simulateGroupUpdate(group, now))
}

export function getProgressColor(percentage) {
  if (isProgressComplete(percentage)) {
    return '#52c41a'
  }
  if (isProgressNearComplete(percentage)) {
    return '#faad14'
  }
  return '#1890ff'
}

export function getProductGroupStats(groups, productId, productGroupSize, now = Date.now()) {
  if (!Array.isArray(groups) || !productId || !productGroupSize) {
    return {
      totalGroups: 0,
      ongoingGroups: 0,
      successGroups: 0,
      failedGroups: 0,
      totalJoinedPeople: 0,
      activeJoinedPeople: 0,
      aggregateCurrentPeople: 0,
      aggregateTotalPeople: 0,
      averageProgress: 0,
      bestProgress: 0,
      bestGroup: null,
    }
  }

  const productGroups = groups.filter((g) => g.productId === productId)
  const totalGroups = productGroups.length
  const ongoingGroups = productGroups.filter((g) => isGroupOngoing(g, now)).length
  const successGroups = productGroups.filter((g) => isGroupSuccess(g, now)).length
  const failedGroups = productGroups.filter((g) => isGroupFailed(g, now)).length

  const totalJoinedPeople = productGroups.reduce(
    (sum, g) => sum + (g.currentPeople || 0),
    0
  )

  const activeJoinedPeople = productGroups.reduce((sum, g) => {
    if (!isGroupOngoing(g, now)) return sum
    return sum + Math.min(g.currentPeople || 0, g.totalPeople || productGroupSize)
  }, 0)

  const aggregateCurrentPeople = productGroups.reduce((sum, g) => {
    const status = getGroupStatus(g, now)
    if (status === GROUP_BUYING_STATUS.FAILED) return sum
    return sum + Math.min(g.currentPeople || 0, g.totalPeople || productGroupSize)
  }, 0)

  const aggregateTotalPeople = productGroups.reduce((sum, g) => {
    const status = getGroupStatus(g, now)
    if (status === GROUP_BUYING_STATUS.FAILED) return sum
    return sum + (g.totalPeople || productGroupSize)
  }, 0)

  let bestProgress = 0
  let bestGroup = null
  productGroups.forEach((g) => {
    if (isGroupFailed(g, now)) return
    const progress = calculateProgressPercentage(g.currentPeople, g.totalPeople)
    if (progress > bestProgress) {
      bestProgress = progress
      bestGroup = g
    }
  })

  const averageProgress =
    aggregateTotalPeople > 0
      ? Math.round((aggregateCurrentPeople / aggregateTotalPeople) * 10000) / 100
      : 0

  return {
    totalGroups,
    ongoingGroups,
    successGroups,
    failedGroups,
    totalJoinedPeople,
    activeJoinedPeople,
    aggregateCurrentPeople,
    aggregateTotalPeople,
    averageProgress,
    bestProgress,
    bestGroup,
  }
}

export function findJoinableGroup(groups, productId, userId, now = Date.now()) {
  if (!Array.isArray(groups) || !productId || !userId) return null

  const joinableGroups = groups
    .filter((g) => g.productId === productId && canJoinGroup(g, userId, now))
    .sort((a, b) => {
      const remainingA = getRemainingSpots(a.currentPeople, a.totalPeople)
      const remainingB = getRemainingSpots(b.currentPeople, b.totalPeople)
      return remainingA - remainingB
    })

  return joinableGroups.length > 0 ? joinableGroups[0] : null
}

