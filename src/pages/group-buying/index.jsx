import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './group-buying.css'
import {
  PRODUCTS,
  SORT_TYPE,
  SORT_TYPE_LABELS,
  GROUP_BUYING_STATUS,
  GROUP_BUYING_STATUS_LABELS,
  DEFAULT_AVATAR,
  REFRESH_INTERVAL_MS,
  ACTIVITY_DURATION_HOURS,
} from './constants.js'
import {
  formatPrice,
  calculateSavings,
  formatCountdown,
  isCountdownWarning,
  calculateProgressPercentage,
  isProgressComplete,
  isProgressNearComplete,
  getRemainingSpots,
  getGroupStatus,
  getGroupRemainingTime,
  updateGroupStatus,
  sortGroups,
  canJoinGroup,
  hasUserJoinedGroup,
  joinGroup,
  createGroup,
  hasUserOngoingGroup,
  getOngoingGroups,
  getLedGroups,
  getJoinedGroups,
  formatDateTime,
  simulateNewGroup,
  simulateGroupsUpdate,
  getProgressColor,
  getProductGroupStats,
  findJoinableGroup,
} from './utils.js'
import {
  loadGroups,
  saveGroups,
  loadCurrentUser,
  saveCurrentUser,
} from './storage.js'

const VIEW_TABS = {
  HALL: 'hall',
  MY_GROUPS: 'my_groups',
}

export default function GroupBuyingPage() {
  const navigate = useNavigate()
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [groups, setGroups] = useState(() => loadGroups())
  const [sortType, setSortType] = useState(SORT_TYPE.LATEST)
  const [currentView, setCurrentView] = useState(VIEW_TABS.HALL)
  const [currentUser] = useState(() => {
    const saved = loadCurrentUser()
    if (saved) return saved
    const user = {
      id: 'user_' + Date.now().toString(36),
      name: '我',
      avatar: DEFAULT_AVATAR,
    }
    saveCurrentUser(user)
    return user
  })
  const [now, setNow] = useState(() => Date.now())
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)
  const refreshTimerRef = useRef(null)
  const groupListSectionRef = useRef(null)

  const currentProduct = PRODUCTS[currentProductIndex]

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    setToast({ message, type })
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
    }, 2000)
  }, [])

  const handleGroupsChange = useCallback((newGroups) => {
    setGroups(newGroups)
    saveGroups(newGroups)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const updatedGroups = groups.map((g) => updateGroupStatus(g, now))
    const hasChanges = updatedGroups.some((g, i) => g.status !== groups[i].status)
    if (hasChanges) {
      queueMicrotask(() => {
        handleGroupsChange(updatedGroups)
      })
    }
  }, [now, groups, handleGroupsChange])

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      setGroups((prevGroups) => {
        let updated = simulateGroupsUpdate(prevGroups, Date.now())
        if (Math.random() > 0.6) {
          updated = simulateNewGroup(updated, PRODUCTS, Date.now())
        }
        saveGroups(updated)
        return updated
      })
    }, REFRESH_INTERVAL_MS)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [])

  const handleManualRefresh = () => {
    setGroups((prevGroups) => {
      let updated = simulateGroupsUpdate(prevGroups, Date.now())
      updated = simulateNewGroup(updated, PRODUCTS, Date.now())
      saveGroups(updated)
      return updated
    })
    showToast('刷新成功', 'success')
  }

  const [activityEndTime] = useState(() =>
    Date.now() + ACTIVITY_DURATION_HOURS * 60 * 60 * 1000
  )
  const activityRemaining = Math.max(0, activityEndTime - now)
  const activityCountdown = formatCountdown(activityRemaining)
  const isActivityWarning = isCountdownWarning(activityRemaining)
  const isActivityEnded = activityRemaining <= 0

  const ongoingGroups = getOngoingGroups(groups, currentProduct.id, now)
  const sortedOngoingGroups = sortGroups(ongoingGroups, sortType, now)

  const userLedGroups = getLedGroups(groups, currentUser.id)
  const userJoinedGroups = getJoinedGroups(groups, currentUser.id)
  const userAllGroups = [...userLedGroups, ...userJoinedGroups].sort(
    (a, b) => b.createdAt - a.createdAt
  )

  const hasOngoingGroup = hasUserOngoingGroup(groups, currentUser.id, currentProduct.id, now)

  const handleCreateGroup = () => {
    if (isActivityEnded) {
      showToast('活动已结束', 'error')
      return
    }
    if (hasOngoingGroup) {
      showToast('您已有进行中的拼团，请先查看', 'warning')
      setCurrentView(VIEW_TABS.MY_GROUPS)
      return
    }

    const duration = Math.min(
      activityRemaining,
      2 * 60 * 60 * 1000
    )

    const newGroup = createGroup(
      currentProduct.id,
      currentProduct.name,
      currentProduct.image,
      currentProduct.groupSize,
      currentProduct.groupPrice,
      currentUser.id,
      currentUser.name,
      currentUser.avatar,
      duration,
      now
    )

    handleGroupsChange([...groups, newGroup])
    showToast('拼团发起成功！', 'success')
    setCurrentView(VIEW_TABS.MY_GROUPS)
  }

  const handleJoinGroup = (group) => {
    if (isActivityEnded) {
      showToast('活动已结束', 'error')
      return
    }
    if (!canJoinGroup(group, currentUser.id, now)) {
      if (hasUserJoinedGroup(group, currentUser.id)) {
        showToast('您已参与该拼团', 'warning')
      } else {
        showToast('无法加入该拼团', 'error')
      }
      return
    }

    const result = joinGroup(
      group,
      currentUser.id,
      currentUser.name,
      currentUser.avatar,
      now
    )

    if (result.success) {
      const updatedGroups = groups.map((g) =>
        g.id === group.id ? result.group : g
      )
      handleGroupsChange(updatedGroups)

      if (result.group.status === GROUP_BUYING_STATUS.SUCCESS) {
        showToast('恭喜！拼团成功！', 'success')
      } else {
        showToast('参团成功！', 'success')
      }
    } else {
      showToast('参团失败', 'error')
    }
  }

  const handleJoinExistingGroup = () => {
    if (isActivityEnded) {
      showToast('活动已结束', 'error')
      return
    }
    if (hasOngoingGroup) {
      showToast('您已有进行中的拼团，请先查看', 'warning')
      setCurrentView(VIEW_TABS.MY_GROUPS)
      return
    }

    const joinableGroup = findJoinableGroup(groups, currentProduct.id, currentUser.id, now)

    if (joinableGroup) {
      handleJoinGroup(joinableGroup)
    } else {
      showToast('暂无可参与的拼团，为您发起新团', 'info')
      handleCreateGroup()
    }
  }

  const productStats = getProductGroupStats(
    groups,
    currentProduct.id,
    currentProduct.groupSize,
    now
  )
  const bestProgress = productStats.bestProgress > 0 ? productStats.bestProgress : productStats.averageProgress
  const progressPercentage = bestProgress
  const displayCurrentPeople = productStats.activeJoinedPeople
  const displayTotalSpots = productStats.ongoingGroups * currentProduct.groupSize
  const displayRemainingSpots = getRemainingSpots(displayCurrentPeople, displayTotalSpots || currentProduct.groupSize)

  return (
    <div className="group-buying-page">
      <div className="gb-header">
        <button className="gb-back-btn" onClick={() => navigate('/')}>
          ← 返回
        </button>
        <h1 className="gb-title">团购活动</h1>
        <div className="gb-header-right"></div>
      </div>

      <div className="gb-view-tabs">
        <button
          className={`gb-view-tab ${currentView === VIEW_TABS.HALL ? 'active' : ''}`}
          onClick={() => setCurrentView(VIEW_TABS.HALL)}
        >
          拼团大厅
        </button>
        <button
          className={`gb-view-tab ${currentView === VIEW_TABS.MY_GROUPS ? 'active' : ''}`}
          onClick={() => setCurrentView(VIEW_TABS.MY_GROUPS)}
        >
          我的拼团
        </button>
      </div>

      {currentView === VIEW_TABS.HALL && (
        <>
          <div className="gb-product-tabs">
            {PRODUCTS.map((product, index) => (
              <button
                key={product.id}
                className={`gb-product-tab ${index === currentProductIndex ? 'active' : ''}`}
                onClick={() => setCurrentProductIndex(index)}
              >
                {product.name.slice(0, 6)}
              </button>
            ))}
          </div>

          <div className="gb-product-section">
            <div className="gb-product-image-wrapper">
              <img
                className="gb-product-image"
                src={currentProduct.image}
                alt={currentProduct.name}
              />
              {isActivityEnded && <div className="gb-activity-ended-mask">活动已结束</div>}
            </div>

            <h2 className="gb-product-name">{currentProduct.name}</h2>
            <p className="gb-product-desc">{currentProduct.description}</p>

            <div className="gb-price-section">
              <span className="gb-group-price">
                <span className="gb-price-symbol">¥</span>
                {currentProduct.groupPrice.toFixed(2)}
              </span>
              <span className="gb-original-price">
                {formatPrice(currentProduct.originalPrice)}
              </span>
              <span className="gb-save-badge">
                比原价省 ¥{calculateSavings(currentProduct.originalPrice, currentProduct.groupPrice).toFixed(0)}
              </span>
            </div>

            <div className="gb-progress-section">
              <div className="gb-progress-info">
                <span className="gb-progress-text">
                  已拼 <strong>{displayCurrentPeople}</strong> 人 / 共需 {currentProduct.groupSize} 人成团
                  {productStats.ongoingGroups > 0 && (
                    <span className="gb-group-count">（{productStats.ongoingGroups}个团进行中）</span>
                  )}
                </span>
                <span className="gb-remaining-spots">
                  剩余 {displayRemainingSpots} 个名额
                </span>
              </div>
              <div className="gb-progress-bar-container">
                <div
                  className="gb-progress-bar-fill"
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor: getProgressColor(progressPercentage),
                  }}
                />
                {isProgressComplete(progressPercentage) && (
                  <span className="gb-progress-badge success">已成团</span>
                )}
                {isProgressNearComplete(progressPercentage) && (
                  <span className="gb-progress-badge warning">即将成团</span>
                )}
              </div>
            </div>

            <div className={`gb-countdown-section ${isActivityWarning ? 'warning' : ''} ${isActivityEnded ? 'ended' : ''}`}>
              <span className="gb-countdown-label">
                {isActivityEnded ? '活动已结束' : '距结束'}
              </span>
              {!isActivityEnded && (
                <div className="gb-countdown-timer">
                  <span className="gb-countdown-number">{activityCountdown.hours}</span>
                  <span className="gb-countdown-colon">:</span>
                  <span className="gb-countdown-number">{activityCountdown.minutes}</span>
                  <span className="gb-countdown-colon">:</span>
                  <span className="gb-countdown-number">{activityCountdown.seconds}</span>
                </div>
              )}
            </div>
          </div>

          <div className="gb-group-list-section" ref={groupListSectionRef}>
            <div className="gb-section-header">
              <h3 className="gb-section-title">进行中的拼团</h3>
              <button
                className="gb-refresh-btn"
                onClick={handleManualRefresh}
              >
                🔄 手动刷新
              </button>
            </div>

            <div className="gb-sort-tabs">
              {Object.values(SORT_TYPE).map((type) => (
                <button
                  key={type}
                  className={`gb-sort-tab ${sortType === type ? 'active' : ''}`}
                  onClick={() => setSortType(type)}
                >
                  {SORT_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            {sortedOngoingGroups.length === 0 ? (
              <div className="gb-empty-state">
                <p>暂无进行中的拼团，快来发起吧</p>
              </div>
            ) : (
              <div className="gb-group-list">
                {sortedOngoingGroups.map((group) => {
                  const groupPercentage = calculateProgressPercentage(
                    group.currentPeople,
                    group.totalPeople
                  )
                  const groupRemaining = getGroupRemainingTime(group, now)
                  const groupCountdown = formatCountdown(groupRemaining)
                  const isJoined = hasUserJoinedGroup(group, currentUser.id)
                  const canJoin = canJoinGroup(group, currentUser.id, now)

                  return (
                    <div key={group.id} className="gb-group-card">
                      <div className="gb-group-card-header">
                        <img
                          className="gb-leader-avatar"
                          src={group.leaderAvatar || DEFAULT_AVATAR}
                          alt={group.leaderName}
                        />
                        <div className="gb-leader-info">
                          <span className="gb-leader-name">{group.leaderName}</span>
                          <span className="gb-leader-badge">团长</span>
                        </div>
                        <span
                          className={`gb-group-status ${group.status}`}
                        >
                          {GROUP_BUYING_STATUS_LABELS[getGroupStatus(group, now)]}
                        </span>
                      </div>

                      <div className="gb-group-card-body">
                        <div className="gb-group-progress">
                          <div className="gb-group-progress-info">
                            <span>
                              已拼 {group.currentPeople}/{group.totalPeople} 人
                            </span>
                            <span className="gb-group-remaining-time">
                              剩余 {groupCountdown.hours}:{groupCountdown.minutes}:{groupCountdown.seconds}
                            </span>
                          </div>
                          <div className="gb-group-progress-bar">
                            <div
                              className="gb-group-progress-fill"
                              style={{
                                width: `${groupPercentage}%`,
                                backgroundColor: getProgressColor(groupPercentage),
                              }}
                            />
                          </div>
                        </div>

                        <div className="gb-group-price-info">
                          <span className="gb-group-price-small">
                            ¥{group.groupPrice.toFixed(2)}
                          </span>
                          <span className="gb-group-price-label">拼团价</span>
                        </div>
                      </div>

                      <div className="gb-group-card-footer">
                        <button
                          className={`gb-join-btn ${
                            isJoined ? 'joined' : canJoin ? 'active' : 'disabled'
                          }`}
                          onClick={() => handleJoinGroup(group)}
                          disabled={!canJoin || isJoined}
                        >
                          {isJoined
                            ? '已参团'
                            : canJoin
                            ? '去参团'
                            : '已满员'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {currentView === VIEW_TABS.MY_GROUPS && (
        <div className="gb-my-groups-section">
          {userAllGroups.length === 0 ? (
            <div className="gb-empty-state">
              <p>暂无拼团记录</p>
              <button
                className="gb-primary-btn"
                onClick={() => setCurrentView(VIEW_TABS.HALL)}
              >
                去拼团
              </button>
            </div>
          ) : (
            <div className="gb-my-groups-list">
              <div className="gb-my-groups-subtitle">我发起的团 ({userLedGroups.length})</div>
              {userLedGroups.length === 0 && (
                <div className="gb-empty-state small">
                  <p>暂无发起的拼团</p>
                </div>
              )}
              {userLedGroups.map((group) => (
                <MyGroupCard
                  key={group.id}
                  group={group}
                  now={now}
                  isLeader={true}
                />
              ))}

              <div className="gb-my-groups-subtitle">我参与的团 ({userJoinedGroups.length})</div>
              {userJoinedGroups.length === 0 && (
                <div className="gb-empty-state small">
                  <p>暂无参与的拼团</p>
                </div>
              )}
              {userJoinedGroups.map((group) => (
                <MyGroupCard
                  key={group.id}
                  group={group}
                  now={now}
                  isLeader={false}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {currentView === VIEW_TABS.HALL && (
        <div className="gb-action-bar">
          <button
            className={`gb-secondary-btn ${isActivityEnded ? 'disabled' : ''}`}
            onClick={handleJoinExistingGroup}
            disabled={isActivityEnded}
          >
            参与现有团
          </button>
          <button
            className={`gb-primary-btn ${isActivityEnded ? 'disabled' : ''}`}
            onClick={handleCreateGroup}
            disabled={isActivityEnded}
          >
            发起新团
          </button>
        </div>
      )}

      {toast && (
        <div className="gb-toast-container">
          <div className={`gb-toast ${toast.type}`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}

function MyGroupCard({ group, now, isLeader }) {
  const status = getGroupStatus(group, now)
  const percentage = calculateProgressPercentage(
    group.currentPeople,
    group.totalPeople
  )
  const remaining = getGroupRemainingTime(group, now)
  const countdown = formatCountdown(remaining)

  return (
    <div className={`gb-my-group-card ${status}`}>
      <div className="gb-my-group-header">
        <img
          className="gb-my-group-product-img"
          src={group.productImage}
          alt={group.productName}
        />
        <div className="gb-my-group-info">
          <h4 className="gb-my-group-name">{group.productName}</h4>
          <div className="gb-my-group-price">
            拼团价：¥{group.groupPrice.toFixed(2)}
          </div>
          <div className="gb-my-group-people">
            {group.currentPeople}/{group.totalPeople}人
            {isLeader && <span className="gb-leader-tag">我是团长</span>}
          </div>
        </div>
        <span className={`gb-my-group-status ${status}`}>
          {GROUP_BUYING_STATUS_LABELS[status]}
        </span>
      </div>

      <div className="gb-my-group-progress">
        <div className="gb-my-group-progress-bar">
          <div
            className="gb-my-group-progress-fill"
            style={{
              width: `${percentage}%`,
              backgroundColor: getProgressColor(percentage),
            }}
          />
        </div>
      </div>

      <div className="gb-my-group-footer">
        {status === GROUP_BUYING_STATUS.ONGOING && (
          <span className="gb-my-group-time">
            剩余 {countdown.hours}:{countdown.minutes}:{countdown.seconds}
          </span>
        )}
        {status === GROUP_BUYING_STATUS.SUCCESS && group.successTime && (
          <span className="gb-my-group-time">
            成团时间：{formatDateTime(group.successTime)}
          </span>
        )}
        {status === GROUP_BUYING_STATUS.FAILED && (
          <span className="gb-my-group-time failed">
            失败原因：{group.failedReason || '拼团失败'}
          </span>
        )}
      </div>
    </div>
  )
}
