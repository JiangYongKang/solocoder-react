import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './security-center.css'
import SecurityGauge from './SecurityGauge.jsx'
import DeviceList from './DeviceList.jsx'
import PasswordChecker from './PasswordChecker.jsx'
import TwoFAManager from './TwoFAManager.jsx'
import OperationLogs from './OperationLogs.jsx'
import {
  loadDevices,
  saveDevices,
  removeDevice,
  loadTwoFAStatus,
  saveTwoFAStatus,
  loadOperations,
  saveOperations,
  appendOperation,
  createOperationRecord,
  calculateScoreBreakdown,
  generateSecurityAdvice,
  generateIpAddress,
} from './securityCenterCore.js'
import {
  OPERATION_TYPES,
  OPERATION_RESULTS,
} from './constants.js'

function SecurityCenterPage() {
  const navigate = useNavigate()

  const [devices, setDevices] = useState(() => loadDevices())
  const [twoFAStatus, setTwoFAStatus] = useState(() => loadTwoFAStatus())
  const [operations, setOperations] = useState(() => loadOperations())
  const [password, setPassword] = useState('')

  useEffect(() => {
    saveDevices(devices)
  }, [devices])

  useEffect(() => {
    saveTwoFAStatus(twoFAStatus)
  }, [twoFAStatus])

  useEffect(() => {
    saveOperations(operations)
  }, [operations])

  const scoreBreakdown = useMemo(() => {
    return calculateScoreBreakdown(
      password,
      twoFAStatus.enabled,
      devices,
      operations
    )
  }, [password, twoFAStatus.enabled, devices, operations])

  const securityAdvice = useMemo(() => {
    return generateSecurityAdvice(scoreBreakdown)
  }, [scoreBreakdown])

  const handleRecordOperation = useCallback((type, detail, result = OPERATION_RESULTS.SUCCESS) => {
    const record = createOperationRecord(
      type,
      detail,
      generateIpAddress(),
      result
    )
    setOperations((prev) => appendOperation(prev, record))
  }, [])

  const handleRemoveDevice = useCallback((device) => {
    setDevices((prev) => removeDevice(prev, device.id))
    handleRecordOperation(
      OPERATION_TYPES.DEVICE_LOGOUT,
      `强制下线设备 ${device.name}（IP：${device.ip}，地点：${device.location}）`
    )
  }, [handleRecordOperation])

  const handlePasswordChange = useCallback((newPassword) => {
    setPassword(newPassword)
  }, [])

  const handleTwoFAToggle = useCallback((enabled, secret) => {
    setTwoFAStatus({ enabled, secret })
  }, [])

  const handleTwoFARecord = useCallback((typeKey, detail) => {
    handleRecordOperation(typeKey, detail)
  }, [handleRecordOperation])

  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  const suggestionTexts = useMemo(() => {
    return securityAdvice.map((a) => a.text)
  }, [securityAdvice])

  return (
    <div className="sc-page">
      <div className="sc-container">
        <header className="sc-header">
          <button className="sc-back-link sc-btn sc-btn-sm" onClick={handleBack}>
            ← 返回首页
          </button>
          <h1 className="sc-title">🔒 账户安全中心</h1>
        </header>

        <section className="sc-section">
          <div className="sc-section-body">
            <SecurityGauge
              score={scoreBreakdown.total}
              breakdown={scoreBreakdown}
              suggestions={suggestionTexts}
            />
          </div>
        </section>

        <section className="sc-section">
          <DeviceList
            devices={devices}
            onRemoveDevice={handleRemoveDevice}
          />
        </section>

        <section className="sc-section">
          <div className="sc-section-body">
            <PasswordChecker onPasswordChange={handlePasswordChange} />
          </div>
        </section>

        <section className="sc-section">
          <TwoFAManager
            enabled={twoFAStatus.enabled}
            secret={twoFAStatus.secret}
            onToggle={handleTwoFAToggle}
            onRecord={handleTwoFARecord}
          />
        </section>

        <section className="sc-section">
          <OperationLogs operations={operations} />
        </section>
      </div>
    </div>
  )
}

export default SecurityCenterPage
