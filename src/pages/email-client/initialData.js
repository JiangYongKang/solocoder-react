import { FOLDERS } from './constants'
import { generateId } from './emailUtils'

const senders = [
  { name: '张三', email: 'zhangsan@example.com' },
  { name: '李四', email: 'lisi@example.com' },
  { name: '王五', email: 'wangwu@example.com' },
  { name: '赵六', email: 'zhaoliu@example.com' },
  { name: '孙七', email: 'sunqi@example.com' },
  { name: '周八', email: 'zhouba@example.com' },
  { name: '吴九', email: 'wujiu@example.com' },
  { name: '郑十', email: 'zhengshi@example.com' },
  { name: 'HR 部门', email: 'hr@company.com' },
  { name: '技术支持', email: 'support@company.com' },
  { name: '市场部', email: 'marketing@company.com' },
  { name: '产品经理', email: 'pm@company.com' },
]

const subjects = [
  '项目进度汇报',
  '会议通知：Q2 季度总结',
  '新功能需求文档',
  'Bug 修复确认',
  '本周工作安排',
  '代码审查邀请',
  '团队建设活动报名',
  '薪资调整通知',
  '技术分享会邀请',
  '产品上线计划',
  '客户反馈汇总',
  '服务器维护通知',
  '年度绩效评估',
  '新员工入职培训',
  '安全审计报告',
  '用户调研问卷',
  '品牌设计方案',
  '数据库迁移计划',
  'API 接口文档更新',
  '紧急：生产环境问题',
  '周会纪要',
  '试用期转正申请',
  '假期审批结果',
  '办公室搬迁通知',
  '供应商合同续签',
  '预算申请审批',
  '招聘面试安排',
  '学习资源推荐',
  '系统升级公告',
  '客户满意度调查',
  '报销流程说明',
  '团建活动照片',
  '产品路线图讨论',
  '前端技术选型',
  '后端架构优化',
  '移动端适配方案',
  '缓存策略调整',
  '日志分析报告',
  '压力测试结果',
  '性能优化建议',
  '代码规范更新',
  '单元测试覆盖率',
  'CI/CD 流程改进',
  '微服务拆分方案',
  '容器化部署计划',
]

const bodies = [
  '<p>你好，</p><p>附件是本项目的最新进度汇报，请查阅。如有疑问请随时联系我。</p><p>谢谢！</p>',
  '<p>各位同事，</p><p>兹定于<strong>本周五下午 2 点</strong>在大会议室召开 Q2 季度总结会议，请各位准时参加。</p><ul><li>准备各自负责模块的汇报材料</li><li>会议时长约 2 小时</li><li>会后提供晚餐</li></ul>',
  '<p>您好，</p><p>最新的需求文档已经上传至<a href="#">文档中心</a>，请相关同事查阅并给出反馈意见。</p><p>截止日期：下周一之前</p>',
  '<p>您好，</p><p>关于昨天提交的 <em>Bug #1234</em> 已完成修复，请验证并确认是否可以关闭。</p>',
  '<p>团队成员好，</p><p>本周工作安排如下：</p><ol><li>完成用户模块重构</li><li>编写单元测试</li><li>代码审查</li><li>联调测试</li></ol><p>如有变动请及时沟通。</p>',
]

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function createMockEmails() {
  const now = Date.now()
  const emails = []

  for (let i = 0; i < 35; i++) {
    const sender = getRandomItem(senders)
    const daysAgo = Math.floor(Math.random() * 30)
    const hoursAgo = Math.floor(Math.random() * 24)
    const minutesAgo = Math.floor(Math.random() * 60)
    const sentAt = now - daysAgo * 86400000 - hoursAgo * 3600000 - minutesAgo * 60000

    emails.push({
      id: generateId(),
      from: `${sender.name} <${sender.email}>`,
      to: 'me@example.com',
      cc: '',
      bcc: '',
      subject: subjects[i % subjects.length],
      body: bodies[i % bodies.length],
      folder: FOLDERS.INBOX,
      originalFolder: FOLDERS.INBOX,
      isRead: i >= 15,
      isStarred: i % 7 === 0,
      isSpam: false,
      sentAt,
    })
  }

  const sentEmails = [
    {
      id: generateId('sent'),
      from: 'me@example.com',
      to: 'zhangsan@example.com',
      cc: '',
      bcc: '',
      subject: 'Re: 项目进度汇报',
      body: '<p>已收到，我会尽快跟进。</p>',
      folder: FOLDERS.SENT,
      isRead: true,
      isStarred: false,
      isSpam: false,
      sentAt: now - 3600000,
    },
    {
      id: generateId('sent'),
      from: 'me@example.com',
      to: 'lisi@example.com, wangwu@example.com',
      cc: 'pm@company.com',
      bcc: '',
      subject: '周会纪要',
      body: '<p>各位好，</p><p>附件是今天的周会纪要，请查收。</p>',
      folder: FOLDERS.SENT,
      isRead: true,
      isStarred: false,
      isSpam: false,
      sentAt: now - 86400000,
    },
  ]

  const draftEmails = [
    {
      id: generateId('draft'),
      from: 'me@example.com',
      to: 'support@company.com',
      cc: '',
      bcc: '',
      subject: '生产环境问题反馈',
      body: '<p>您好，</p><p>关于昨晚的生产环境问题...</p>',
      folder: FOLDERS.DRAFTS,
      isRead: true,
      isStarred: false,
      isSpam: false,
      sentAt: now - 7200000,
    },
  ]

  const trashEmails = [
    {
      id: generateId('trash'),
      from: 'spam@example.com',
      to: 'me@example.com',
      cc: '',
      bcc: '',
      subject: '【垃圾邮件】恭喜您中奖了！',
      body: '<p>您已中奖，请点击链接领取...</p>',
      folder: FOLDERS.TRASH,
      originalFolder: FOLDERS.INBOX,
      isRead: true,
      isStarred: false,
      isSpam: true,
      sentAt: now - 172800000,
    },
  ]

  return [...emails, ...sentEmails, ...draftEmails, ...trashEmails]
    .sort((a, b) => b.sentAt - a.sentAt)
}

export function createInitialEmails() {
  return createMockEmails()
}
