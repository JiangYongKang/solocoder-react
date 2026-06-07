import {
  PROVINCES,
  CITIES,
  INTEREST_FIELDS,
  NOTIFICATION_METHODS,
  USAGE_FREQUENCIES,
} from '../data/cities'

function getNameByCode(list, code) {
  const item = list.find((i) => i.code === code)
  return item ? item.name : '-'
}

export default function Step4Review({ data }) {
  const provinceName = getNameByCode(PROVINCES, data.province)
  const cityName = data.province
    ? getNameByCode(CITIES[data.province] || [], data.city)
    : '-'
  const interestNames = (data.interests || [])
    .map((c) => getNameByCode(INTEREST_FIELDS, c))
    .filter(Boolean)
    .join('、')
  const notificationName = getNameByCode(NOTIFICATION_METHODS, data.notification)
  const frequencyName = getNameByCode(USAGE_FREQUENCIES, data.frequency)

  return (
    <div className="step-content">
      <h2 className="step-title">汇总预览</h2>
      <p className="step-subtitle">请确认以下信息是否正确</p>

      <div className="review-section">
        <h3 className="review-section-title">基本信息</h3>
        <div className="review-row">
          <span className="review-label">姓名</span>
          <span className="review-value">{data.name || '-'}</span>
        </div>
        <div className="review-row">
          <span className="review-label">邮箱</span>
          <span className="review-value">{data.email || '-'}</span>
        </div>
        <div className="review-row">
          <span className="review-label">手机号</span>
          <span className="review-value">{data.phone || '-'}</span>
        </div>
      </div>

      <div className="review-section">
        <h3 className="review-section-title">地址信息</h3>
        <div className="review-row">
          <span className="review-label">省份</span>
          <span className="review-value">{provinceName}</span>
        </div>
        <div className="review-row">
          <span className="review-label">城市</span>
          <span className="review-value">{cityName}</span>
        </div>
        <div className="review-row">
          <span className="review-label">详细地址</span>
          <span className="review-value">{data.address || '-'}</span>
        </div>
      </div>

      <div className="review-section">
        <h3 className="review-section-title">偏好设置</h3>
        <div className="review-row">
          <span className="review-label">感兴趣的领域</span>
          <span className="review-value">{interestNames || '-'}</span>
        </div>
        <div className="review-row">
          <span className="review-label">接收通知方式</span>
          <span className="review-value">{notificationName}</span>
        </div>
        <div className="review-row">
          <span className="review-label">使用频率</span>
          <span className="review-value">{frequencyName}</span>
        </div>
      </div>
    </div>
  )
}
