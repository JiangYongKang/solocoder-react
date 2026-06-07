export const STORAGE_KEY = 'solocoder_notifications';
export const PREFS_STORAGE_KEY = 'solocoder_notification_prefs';
export const MAX_ACTIVE_NOTIFICATIONS = 50;

export const NOTIFICATION_TYPES = {
  SYSTEM: 'system',
  MESSAGE: 'message',
  TASK: 'task',
};

export const TYPE_LABELS = {
  [NOTIFICATION_TYPES.SYSTEM]: '系统通知',
  [NOTIFICATION_TYPES.MESSAGE]: '私信消息',
  [NOTIFICATION_TYPES.TASK]: '任务提醒',
};

export const TYPE_ICONS = {
  [NOTIFICATION_TYPES.SYSTEM]: '🔔',
  [NOTIFICATION_TYPES.MESSAGE]: '💬',
  [NOTIFICATION_TYPES.TASK]: '📋',
};

export const DEFAULT_PREFS = {
  [NOTIFICATION_TYPES.SYSTEM]: true,
  [NOTIFICATION_TYPES.MESSAGE]: true,
  [NOTIFICATION_TYPES.TASK]: true,
};

export const SYSTEM_TEMPLATES = [
  { title: '系统升级公告', content: '系统将于今晚 22:00-23:00 进行版本升级维护，届时部分功能可能无法正常使用，请提前保存您的工作进度。感谢您的理解与支持。' },
  { title: '安全提醒', content: '检测到您的账号在新设备上登录，如非本人操作，请立即修改密码并联系客服。您可以在账户安全中心查看登录记录。' },
  { title: '存储空间告急', content: '您的存储空间已使用 85%，为避免影响正常使用，建议及时清理不必要的文件或升级存储空间套餐。' },
  { title: '新功能上线', content: '全新的数据看板功能已上线，支持多维度数据可视化分析，助您更快做出业务决策。点击查看使用指南。' },
  { title: '服务条款更新', content: '我们的服务条款即将更新，请在生效前仔细阅读新版条款。继续使用服务即表示您同意更新后的条款。' },
];

export const MESSAGE_TEMPLATES = [
  { title: '张三给你发了一条私信', content: '你好，关于昨天讨论的那个项目方案，我有一些新的想法想和你交流。你今天下午有空吗？我们可以开个短会讨论一下。' },
  { title: '李四邀请你加入团队', content: '项目组需要一位前端开发专家，我第一时间就想到了你。如果你感兴趣的话，下周我们可以详细聊聊具体的职责和安排。' },
  { title: '王五回复了你的评论', content: '感谢你的建议！我已经按照你说的思路调整了方案，整体效果确实好了很多。有空可以帮我再看看有没有其他可以优化的地方？' },
  { title: '赵六提到了你', content: '在今天的项目周会上，赵六提到了你在上个迭代中的优秀表现，团队对你的工作成果给予了高度评价。继续加油！' },
  { title: '系统消息：审批已通过', content: '您提交的休假申请已通过审批，请提前安排好工作交接，祝您假期愉快！如有紧急事务请联系您的直属上级。' },
];

export const TASK_TEMPLATES = [
  { title: '任务截止提醒：修复登录 Bug', content: '您分配的任务「修复登录页面样式错位」将于明天截止，当前状态为进行中。请合理安排时间，确保按时交付。' },
  { title: '新任务分配：用户头像上传', content: '项目经理给您分配了新任务「实现用户头像上传功能」，预计工期 2 天。请及时查看任务详情并确认开始时间。' },
  { title: '任务评审已完成', content: '您提交的任务「优化列表加载速度」已通过代码评审，可以合并到主分支。感谢您的高质量交付！' },
  { title: '每日站会提醒', content: '上午 10:00 的每日站会即将开始，请准备好昨天的工作总结、今天的工作计划，以及需要协调的问题。' },
  { title: '任务状态变更通知', content: '您关注的任务「接入用户认证模块」状态已更新为「已完成」。点击查看任务详情和验收结果。' },
];
