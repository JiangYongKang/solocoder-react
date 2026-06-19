import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './bill-splitter.css'
import ParticipantPanel from './ParticipantPanel'
import ExpensePanel from './ExpensePanel'
import SettlementPanel from './SettlementPanel'
import HistoryDrawer, { SaveModal } from './HistoryDrawer'
import {
  calculateTotalAmount,
  loadHistory,
  saveHistory,
  addToHistory,
  deleteFromHistory,
  createBillRecord,
  formatDateTime,
} from './utils'

export default function BillSplitterPage() {
  const navigate = useNavigate()

  const [participants, setParticipants] = useState([])
  const [expenses, setExpenses] = useState([])
  const [history, setHistory] = useState(() => loadHistory())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveModalKey, setSaveModalKey] = useState(0)
  const [saveInitialName, setSaveInitialName] = useState('')

  useEffect(() => {
    saveHistory(history)
  }, [history])

  const totalAmount = useMemo(() => calculateTotalAmount(expenses), [expenses])

  const handleBack = () => {
    navigate('/')
  }

  const openSaveModal = () => {
    setSaveInitialName(`账单 ${formatDateTime(Date.now()).slice(0, 10)}`)
    setSaveModalKey((k) => k + 1)
    setSaveModalOpen(true)
  }

  const handleSave = (name) => {
    const bill = createBillRecord(name, participants, expenses)
    const next = addToHistory(bill, history)
    setHistory(next)
    setSaveModalOpen(false)
  }

  const handleRestore = (bill) => {
    setParticipants(bill.participants || [])
    setExpenses(bill.expenses || [])
  }

  const handleDeleteHistory = (billId) => {
    setHistory(deleteFromHistory(history, billId))
  }

  const handleClearAll = () => {
    if (confirm('确认清空当前所有参与者和费用吗？')) {
      setParticipants([])
      setExpenses([])
    }
  }

  const canSave = participants.length >= 2 && expenses.length > 0

  return (
    <div className="bill-splitter-page">
      <div className="bill-splitter-header">
        <button
          type="button"
          className="bill-splitter-back-btn"
          onClick={handleBack}
        >
          ← 返回
        </button>
        <h1 className="bill-splitter-title">账单分摊计算器</h1>
        <div className="bill-splitter-actions">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setDrawerOpen(true)}
          >
            历史记录 ({history.length})
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleClearAll}
            disabled={participants.length === 0 && expenses.length === 0}
          >
            清空
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={openSaveModal}
            disabled={!canSave}
          >
            保存账单
          </button>
        </div>
      </div>

      <div className="bill-splitter-main">
        <ParticipantPanel
          participants={participants}
          setParticipants={setParticipants}
        />

        <ExpensePanel
          expenses={expenses}
          setExpenses={setExpenses}
          participants={participants}
          totalAmount={totalAmount}
        />

        <SettlementPanel
          participants={participants}
          expenses={expenses}
        />
      </div>

      <HistoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        history={history}
        onRestore={handleRestore}
        onDelete={handleDeleteHistory}
      />

      <SaveModal
        key={saveModalKey}
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSave}
        initialName={saveInitialName}
      />
    </div>
  )
}
