import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './message-queue.css';
import {
  loadTopics,
  saveTopics,
  loadMessages,
  saveMessages,
  loadConsumerGroups,
  saveConsumerGroups,
  loadDeadLetters,
  saveDeadLetters,
  loadBacklogHistory,
  saveBacklogHistory,
} from './storage.js';
import {
  createTopic,
  deleteTopicCascade,
  publishMessage,
  getRemainingDelay,
  getMessageEffectiveStatus,
  getTopicTotalMessages,
  getTopicBacklogCount,
  getConsumerGroupOffset,
  getUnconsumedCount,
  simulateConsume,
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
  formatDateTime,
  formatCountdown,
} from './utils.js';
import {
  MESSAGE_STATUS,
  MESSAGE_STATUS_LABELS,
  CHART_UPDATE_INTERVAL,
  COUNTDOWN_UPDATE_INTERVAL,
  DEFAULT_MAX_RETRIES,
} from './constants.js';

function BacklogChart({ history, topics, totalBacklog }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);
    const padTop = 20;
    const padRight = 20;
    const padBottom = 40;
    const padLeft = 50;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;
    if (chartW <= 0 || chartH <= 0) return;

    const now = Date.now();
    const timeRange = 30 * 60 * 1000;
    const startTime = now - timeRange;

    ctx.strokeStyle = 'var(--border, #e5e4e7)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padTop + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const x = padLeft + (chartW / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + chartH);
      ctx.stroke();
    }

    let maxVal = 10;
    for (const point of history) {
      for (const tid of Object.keys(point.backlogs || {})) {
        if (point.backlogs[tid] > maxVal) maxVal = point.backlogs[tid];
      }
    }
    maxVal = Math.ceil(maxVal * 1.2) || 10;

    ctx.fillStyle = 'var(--text, #6b6375)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const val = Math.round((maxVal / 5) * (5 - i));
      const y = padTop + (chartH / 5) * i;
      ctx.fillText(String(val), padLeft - 8, y);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i <= 6; i++) {
      const t = startTime + (timeRange / 6) * i;
      const d = new Date(t);
      const label = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const x = padLeft + (chartW / 6) * i;
      ctx.fillText(label, x, padTop + chartH + 8);
    }

    topics.forEach((topic, idx) => {
      const color = getTopicColor(idx);
      const points = history.filter((p) => p.backlogs && p.backlogs[topic.id] !== undefined);
      if (points.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      let started = false;
      for (const p of points) {
        const x = padLeft + ((p.timestamp - startTime) / timeRange) * chartW;
        const y = padTop + chartH - (p.backlogs[topic.id] / maxVal) * chartH;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    });

    const legendY = padTop + chartH + 26;
    let legendX = padLeft;
    topics.forEach((topic, idx) => {
      const color = getTopicColor(idx);
      ctx.fillStyle = color;
      ctx.fillRect(legendX, legendY, 12, 12);
      ctx.fillStyle = 'var(--text, #6b6375)';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(topic.name, legendX + 16, legendY + 6);
      legendX += ctx.measureText(topic.name).width + 36;
    });
  }, [history, topics]);

  return (
    <div className="mq-chart-section">
      <h3 className="mq-chart-title">积压数量趋势（最近30分钟）</h3>
      <div className="mq-chart-container">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="mq-chart-total">
        当前总积压数：<strong>{totalBacklog}</strong>
      </div>
    </div>
  );
}

const DETAIL_TABS = [
  { key: 'messages', label: '消息列表' },
  { key: 'consumers', label: '消费者组' },
  { key: 'deadletter', label: '死信队列' },
  { key: 'settings', label: '主题设置' },
];

export default function MessageQueuePage() {
  const navigate = useNavigate();

  const [topics, setTopics] = useState(() => loadTopics());
  const [messages, setMessages] = useState(() => loadMessages());
  const [consumerGroups, setConsumerGroups] = useState(() => loadConsumerGroups());
  const [deadLetters, setDeadLetters] = useState(() => loadDeadLetters());
  const [backlogHistory, setBacklogHistory] = useState(() => loadBacklogHistory());

  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [detailTab, setDetailTab] = useState('messages');

  const [newTopicName, setNewTopicName] = useState('');
  const [publishContent, setPublishContent] = useState('');
  const [sendMode, setSendMode] = useState('immediate');
  const [delaySeconds, setDelaySeconds] = useState(30);
  const [newGroupName, setNewGroupName] = useState('');
  const [editMaxRetries, setEditMaxRetries] = useState(DEFAULT_MAX_RETRIES);
  const [maxRetriesError, setMaxRetriesError] = useState('');
  const [maxRetriesSaveMsg, setMaxRetriesSaveMsg] = useState('');

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => saveTopics(topics), [topics]);
  useEffect(() => saveMessages(messages), [messages]);
  useEffect(() => saveConsumerGroups(consumerGroups), [consumerGroups]);
  useEffect(() => saveDeadLetters(deadLetters), [deadLetters]);
  useEffect(() => saveBacklogHistory(backlogHistory), [backlogHistory]);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      setMessages((prev) => {
        const { updatedMessages, changed } = processDelayedMessages(prev, currentNow);
        return changed ? updatedMessages : prev;
      });
    }, COUNTDOWN_UPDATE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const backlogs = getBacklogByTopic(topics, messages, consumerGroups);
      setBacklogHistory((prev) => {
        const pruned = pruneOldBacklogHistory(prev);
        return addBacklogDataPoint(pruned, backlogs);
      });
    }, CHART_UPDATE_INTERVAL);
    return () => clearInterval(timer);
  }, [topics, messages, consumerGroups]);

  const totalBacklog = useMemo(
    () => getTotalBacklog(topics, messages, consumerGroups, now),
    [topics, messages, consumerGroups, now]
  );

  const totalMessages = useMemo(
    () => topics.reduce((sum, t) => sum + getTopicTotalMessages(messages, t.id), 0),
    [topics, messages]
  );

  const totalDeadLetters = useMemo(
    () => deadLetters.length,
    [deadLetters]
  );

  const selectedTopic = useMemo(
    () => topics.find((t) => t.id === selectedTopicId) || null,
    [topics, selectedTopicId]
  );

  const topicMessages = useMemo(
    () => (selectedTopicId ? messages.filter((m) => m.topicId === selectedTopicId && m.status !== MESSAGE_STATUS.DEAD_LETTER) : []),
    [messages, selectedTopicId]
  );

  const topicGroups = useMemo(
    () => (selectedTopicId ? consumerGroups.filter((g) => g.topicId === selectedTopicId) : []),
    [consumerGroups, selectedTopicId]
  );

  const topicDeadLetters = useMemo(
    () => (selectedTopicId ? getTopicDeadLetters(deadLetters, selectedTopicId) : []),
    [deadLetters, selectedTopicId]
  );

  const handleCreateTopic = useCallback(() => {
    const topic = createTopic(newTopicName);
    if (!topic) return;
    setTopics((prev) => [...prev, topic]);
    setNewTopicName('');
  }, [newTopicName]);

  const handleDeleteTopic = useCallback((topicId) => {
    if (!confirm('确定要删除该主题及其所有消息和订阅关系吗？')) return;
    const result = deleteTopicCascade(topicId, topics, messages, consumerGroups, deadLetters);
    setTopics(result.topics);
    setMessages(result.messages);
    setConsumerGroups(result.consumerGroups);
    setDeadLetters(result.deadLetters);
    if (selectedTopicId === topicId) {
      setSelectedTopicId(null);
    }
  }, [topics, messages, consumerGroups, deadLetters, selectedTopicId]);

  const handleSelectTopic = useCallback((topicId) => {
    setSelectedTopicId(topicId);
    setDetailTab('messages');
    const topic = topics.find((t) => t.id === topicId);
    if (topic) {
      setEditMaxRetries(topic.maxRetries);
    }
    setMaxRetriesError('');
    setMaxRetriesSaveMsg('');
  }, [topics]);

  const handleBackToList = useCallback(() => {
    setSelectedTopicId(null);
  }, []);

  const handlePublish = useCallback(() => {
    const msg = publishMessage(selectedTopicId, publishContent, sendMode, delaySeconds);
    if (!msg) return;
    setMessages((prev) => [...prev, msg]);
    setPublishContent('');
    setSendMode('immediate');
    setDelaySeconds(30);
  }, [selectedTopicId, publishContent, sendMode, delaySeconds]);

  const handleSimulateConsume = useCallback((groupId) => {
    const group = consumerGroups.find((g) => g.id === groupId);
    if (!group) return;
    const result = simulateConsume(group, messages, now);
    if (result.consumed) {
      setMessages(result.updatedMessages);
    }
  }, [consumerGroups, messages, now]);

  const handleSimulateFailConsume = useCallback((messageId) => {
    const result = simulateFailConsume(messageId, messages, topics);
    if (result.shouldDeadLetter) {
      const { updatedMessages, updatedDeadLetters } = moveToDeadLetter(
        messageId,
        result.updatedMessages,
        [...deadLetters, result.deadLetter]
      );
      setMessages(updatedMessages);
      setDeadLetters(updatedDeadLetters);
    } else {
      setMessages(result.updatedMessages);
    }
  }, [messages, topics, deadLetters]);

  const handleRequeueDeadLetter = useCallback((deadLetterId) => {
    const { updatedDeadLetters, updatedMessages } = requeueDeadLetter(deadLetterId, deadLetters, messages);
    setDeadLetters(updatedDeadLetters);
    setMessages(updatedMessages);
  }, [deadLetters, messages]);

  const handleDeleteDeadLetter = useCallback((deadLetterId) => {
    setDeadLetters(deleteDeadLetter(deadLetterId, deadLetters));
  }, [deadLetters]);

  const handleCreateConsumerGroup = useCallback(() => {
    const group = createConsumerGroup(selectedTopicId, newGroupName);
    if (!group) return;
    setConsumerGroups((prev) => [...prev, group]);
    setNewGroupName('');
  }, [selectedTopicId, newGroupName]);

  const handleUpdateMaxRetries = useCallback((value) => {
    const num = Number(value);
    if (!Number.isFinite(num) || !Number.isInteger(num) || num < 1 || num > 10) {
      setMaxRetriesError('最大重试次数必须是 1-10 之间的整数');
      setMaxRetriesSaveMsg('');
      return;
    }
    setMaxRetriesError('');
    setTopics((prev) =>
      prev.map((t) => (t.id === selectedTopicId ? { ...t, maxRetries: num } : t))
    );
    setMaxRetriesSaveMsg('保存成功');
    setTimeout(() => setMaxRetriesSaveMsg(''), 2000);
  }, [selectedTopicId]);

  function renderTopicList() {
    return (
      <div>
        <div className="mq-stats">
          <div className="mq-stat-card">
            <div className="mq-stat-card-title">主题数</div>
            <div className="mq-stat-card-value">{topics.length}</div>
          </div>
          <div className="mq-stat-card">
            <div className="mq-stat-card-title">消息总数</div>
            <div className="mq-stat-card-value">{totalMessages}</div>
          </div>
          <div className="mq-stat-card">
            <div className="mq-stat-card-title">当前积压</div>
            <div className={`mq-stat-card-value ${totalBacklog > 0 ? 'warning' : ''}`}>{totalBacklog}</div>
          </div>
          <div className="mq-stat-card">
            <div className="mq-stat-card-title">死信数</div>
            <div className="mq-stat-card-value">{totalDeadLetters}</div>
          </div>
        </div>

        <BacklogChart history={backlogHistory} topics={topics} totalBacklog={totalBacklog} />

        <div className="mq-toolbar">
          <div className="mq-toolbar-left">
            <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-h)' }}>主题列表</h2>
          </div>
          <div className="mq-toolbar-right">
            <input
              className="mq-input"
              type="text"
              placeholder="输入主题名称"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTopic()}
            />
            <button className="mq-btn mq-btn-primary" onClick={handleCreateTopic}>
              新增主题
            </button>
          </div>
        </div>

        {topics.length === 0 ? (
          <div className="mq-empty">
            <div className="mq-empty-icon">📨</div>
            <p>暂无主题，请先创建一个主题</p>
          </div>
        ) : (
          <table className="mq-data-table">
            <thead>
              <tr>
                <th>主题名称</th>
                <th>消息总数</th>
                <th>积压数量</th>
                <th>消费者组</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => {
                const total = getTopicTotalMessages(messages, topic.id);
                const backlog = getTopicBacklogCount(messages, topic.id, consumerGroups, now);
                const groupCount = consumerGroups.filter((g) => g.topicId === topic.id).length;
                return (
                  <tr key={topic.id}>
                    <td>
                      <span className="topic-name" onClick={() => handleSelectTopic(topic.id)}>
                        {topic.name}
                      </span>
                    </td>
                    <td>{total}</td>
                    <td style={{ color: backlog > 0 ? '#ff4d4f' : 'inherit' }}>{backlog}</td>
                    <td>{groupCount}</td>
                    <td>
                      <button className="mq-btn-link danger" onClick={() => handleDeleteTopic(topic.id)}>
                        删除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  function renderMessageStatus(msg) {
    const effectiveStatus = getMessageEffectiveStatus(msg, consumerGroups, now);
    if (effectiveStatus === MESSAGE_STATUS.DELAYED) {
      const remaining = getRemainingDelay(msg, now);
      return (
        <span>
          <span className={`mq-status-tag ${effectiveStatus}`}>
            {MESSAGE_STATUS_LABELS[effectiveStatus]}
          </span>
          <span className="mq-countdown"> {formatCountdown(remaining)}</span>
        </span>
      );
    }
    return <span className={`mq-status-tag ${effectiveStatus}`}>{MESSAGE_STATUS_LABELS[effectiveStatus]}</span>;
  }

  function renderMessages() {
    return (
      <div>
        <div className="mq-publish-form">
          <div className="mq-form-row">
            <span className="mq-publish-label">消息内容</span>
            <input
              className="mq-input"
              style={{ flex: 1 }}
              type="text"
              placeholder="输入消息内容"
              value={publishContent}
              onChange={(e) => setPublishContent(e.target.value)}
            />
          </div>
          <div className="mq-form-row">
            <span className="mq-publish-label">发送方式</span>
            <select
              className="mq-select"
              value={sendMode}
              onChange={(e) => setSendMode(e.target.value)}
            >
              <option value="immediate">立即发送</option>
              <option value="delayed">延迟发送</option>
            </select>
            {sendMode === 'delayed' && (
              <>
                <select
                  className="mq-select"
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                >
                  <option value={10}>10秒</option>
                  <option value={30}>30秒</option>
                  <option value={60}>60秒</option>
                  <option value={120}>120秒</option>
                  <option value={0}>自定义</option>
                </select>
                {delaySeconds === 0 && (
                  <input
                    className="mq-input mq-input-small"
                    type="number"
                    placeholder="秒数"
                    min={1}
                    onChange={(e) => setDelaySeconds(Number(e.target.value) || 1)}
                  />
                )}
              </>
            )}
            <button className="mq-btn mq-btn-primary" onClick={handlePublish}>
              发布消息
            </button>
          </div>
        </div>

        {topicMessages.length === 0 ? (
          <div className="mq-empty">
            <div className="mq-empty-icon">📭</div>
            <p>暂无消息，请发布第一条消息</p>
          </div>
        ) : (
          <table className="mq-data-table">
            <thead>
              <tr>
                <th>消息ID</th>
                <th>内容</th>
                <th>状态</th>
                <th>重试次数</th>
                <th>发布/预计送达时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {[...topicMessages].sort((a, b) => b.createdAt - a.createdAt).map((msg) => (
                <tr key={msg.id}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{msg.id.slice(-8)}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.content}
                  </td>
                  <td>{renderMessageStatus(msg)}</td>
                  <td>
                    <span className={`mq-retry-badge ${msg.retryCount < (selectedTopic?.maxRetries || DEFAULT_MAX_RETRIES) ? 'ok' : ''}`}>
                      {msg.retryCount}/{selectedTopic?.maxRetries || DEFAULT_MAX_RETRIES}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {msg.scheduledTime
                      ? `预计 ${formatDateTime(msg.scheduledTime)}`
                      : formatDateTime(msg.createdAt)}
                  </td>
                  <td>
                    <div className="mq-actions">
                      <button
                        className="mq-btn-link danger mq-btn-sm"
                        onClick={() => handleSimulateFailConsume(msg.id)}
                        disabled={msg.status === MESSAGE_STATUS.DEAD_LETTER}
                      >
                        消费失败
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  function renderConsumers() {
    return (
      <div>
        <div className="mq-toolbar">
          <div className="mq-toolbar-left">
            <h3 style={{ margin: 0, fontSize: 16 }}>消费者组列表</h3>
          </div>
          <div className="mq-toolbar-right">
            <input
              className="mq-input"
              type="text"
              placeholder="消费者组名称"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateConsumerGroup()}
            />
            <button className="mq-btn mq-btn-primary" onClick={handleCreateConsumerGroup}>
              新建消费者组
            </button>
          </div>
        </div>

        {topicGroups.length === 0 ? (
          <div className="mq-empty">
            <div className="mq-empty-icon">👥</div>
            <p>暂无消费者组，请先创建</p>
          </div>
        ) : (
          <table className="mq-data-table">
            <thead>
              <tr>
                <th>组名</th>
                <th>当前消费位点</th>
                <th>未消费消息数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {topicGroups.map((group) => {
                const offset = getConsumerGroupOffset(group, messages);
                const unconsumed = getUnconsumedCount(group, messages, now);
                return (
                  <tr key={group.id}>
                    <td>{group.name}</td>
                    <td>第 {offset} 条</td>
                    <td style={{ color: unconsumed > 0 ? '#ff4d4f' : 'inherit' }}>{unconsumed}</td>
                    <td>
                      <div className="mq-actions">
                        <button
                          className="mq-btn mq-btn-success mq-btn-sm"
                          onClick={() => handleSimulateConsume(group.id)}
                          disabled={unconsumed === 0}
                        >
                          模拟消费
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  function renderDeadLetters() {
    return (
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>死信队列</h3>
        {topicDeadLetters.length === 0 ? (
          <div className="mq-empty">
            <div className="mq-empty-icon">💀</div>
            <p>暂无死信消息</p>
          </div>
        ) : (
          <table className="mq-data-table">
            <thead>
              <tr>
                <th>原消息内容</th>
                <th>失败原因</th>
                <th>进入死信时间</th>
                <th>重试次数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {[...topicDeadLetters].sort((a, b) => b.enteredAt - a.enteredAt).map((dl) => (
                <tr key={dl.id}>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dl.content}
                  </td>
                  <td><span className="mq-retry-badge">{dl.failReason}</span></td>
                  <td style={{ fontSize: 12 }}>{formatDateTime(dl.enteredAt)}</td>
                  <td>{dl.retryCount}</td>
                  <td>
                    <div className="mq-actions">
                      <button className="mq-btn-link success" onClick={() => handleRequeueDeadLetter(dl.id)}>
                        重新入队
                      </button>
                      <button className="mq-btn-link danger" onClick={() => handleDeleteDeadLetter(dl.id)}>
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  function renderSettings() {
    if (!selectedTopic) return null;
    return (
      <div className="mq-topic-settings">
        <div className="mq-form-group">
          <label className="mq-form-label">主题名称</label>
          <input className="mq-form-input" type="text" value={selectedTopic.name} readOnly />
        </div>
        <div className="mq-form-group">
          <label className="mq-form-label">最大重试次数（1-10）</label>
          <div className="mq-form-row">
            <input
              className="mq-form-input"
              type="number"
              min={1}
              max={10}
              value={editMaxRetries}
              onChange={(e) => {
                setEditMaxRetries(Number(e.target.value));
                if (maxRetriesError) setMaxRetriesError('');
                if (maxRetriesSaveMsg) setMaxRetriesSaveMsg('');
              }}
              style={{ width: 120 }}
            />
            <button
              className="mq-btn mq-btn-primary"
              onClick={() => handleUpdateMaxRetries(editMaxRetries)}
            >
              保存
            </button>
          </div>
          {maxRetriesError && (
            <div style={{ color: '#ff4d4f', fontSize: 13, marginTop: 6 }}>
              ⚠️ {maxRetriesError}
            </div>
          )}
          {maxRetriesSaveMsg && (
            <div style={{ color: '#52c41a', fontSize: 13, marginTop: 6 }}>
              ✅ {maxRetriesSaveMsg}
            </div>
          )}
        </div>
        <div className="mq-form-group">
          <label className="mq-form-label">创建时间</label>
          <input className="mq-form-input" type="text" value={formatDateTime(selectedTopic.createdAt)} readOnly />
        </div>
      </div>
    );
  }

  function renderDetail() {
    if (!selectedTopic) return null;

    return (
      <div className="mq-topic-detail">
        <div className="mq-detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="back-link" onClick={handleBackToList}>
              ← 返回列表
            </button>
            <h2 className="mq-detail-title">{selectedTopic.name}</h2>
          </div>
        </div>

        <div className="mq-tabs">
          {DETAIL_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`mq-tab-btn ${detailTab === tab.key ? 'active' : ''}`}
              onClick={() => setDetailTab(tab.key)}
            >
              {tab.label}
              {tab.key === 'deadletter' && topicDeadLetters.length > 0 && (
                <span style={{ marginLeft: 4, fontSize: 12, color: '#ff4d4f' }}>
                  ({topicDeadLetters.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {detailTab === 'messages' && renderMessages()}
        {detailTab === 'consumers' && renderConsumers()}
        {detailTab === 'deadletter' && renderDeadLetters()}
        {detailTab === 'settings' && renderSettings()}
      </div>
    );
  }

  return (
    <div className="mq-page">
      <div className="mq-header">
        <div className="mq-header-left">
          <button className="back-link" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="mq-page-title">消息队列模拟</h1>
        </div>
      </div>

      {selectedTopicId ? renderDetail() : renderTopicList()}
    </div>
  );
}
