import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackupProvider, useBackup } from './BackupContext.jsx';
import StatusBar from './StatusBar.jsx';
import PlanList from './PlanList.jsx';
import PlanForm from './PlanForm.jsx';
import Timeline from './Timeline.jsx';
import RestoreModal from './RestoreModal.jsx';
import StorageStats from './StorageStats.jsx';
import './backup-manager.css';

function BackupManagerContent() {
  const navigate = useNavigate();
  const { updatePlan, deletePlan, triggerManualBackup } = useBackup();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, plan: null });
  const [restoreModal, setRestoreModal] = useState({ open: false, record: null });

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setFormOpen(true);
  };

  const handleOpenPlanEditor = (plan) => {
    setEditingPlan(plan);
    setFormOpen(true);
  };

  const handleUpdatePlan = (planId, updates) => {
    return updatePlan(planId, updates);
  };

  const handleAskDelete = (plan) => {
    setDeleteConfirm({ open: true, plan });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.plan) {
      deletePlan(deleteConfirm.plan.id);
    }
    setDeleteConfirm({ open: false, plan: null });
  };

  const handleManualRun = async (planId) => {
    const result = await triggerManualBackup(planId);
    if (!result.success && result.error) {
      alert(`备份失败：${result.error}`);
    }
  };

  const handleRestore = (record) => {
    setRestoreModal({ open: true, record });
  };

  return (
    <div className="backup-manager-page">
      <div className="page-header">
        <button className="btn btn-back" onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 className="page-title">备份恢复管理中心</h1>
      </div>

      <StatusBar />

      <div className="main-content">
        <div className="left-panel">
          <PlanList
            onEdit={handleOpenPlanEditor}
            onUpdatePlan={handleUpdatePlan}
            onDelete={handleAskDelete}
            onManualRun={handleManualRun}
            onCreate={handleCreatePlan}
          />
        </div>

        <div className="right-panel">
          <Timeline onRestore={handleRestore} />
        </div>
      </div>

      <StorageStats />

      <PlanForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingPlan(null);
        }}
        editingPlan={editingPlan}
      />

      {deleteConfirm.open && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm({ open: false, plan: null })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">确认删除</h3>
              <button
                className="modal-close"
                onClick={() => setDeleteConfirm({ open: false, plan: null })}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                确定要删除备份计划「{deleteConfirm.plan?.name}」吗？
                此操作将同时删除该计划的所有备份记录，且不可恢复。
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn"
                onClick={() => setDeleteConfirm({ open: false, plan: null })}
              >
                取消
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <RestoreModal
        isOpen={restoreModal.open}
        onClose={() => setRestoreModal({ open: false, record: null })}
        record={restoreModal.record}
      />
    </div>
  );
}

export default function BackupManagerPage() {
  return (
    <BackupProvider>
      <BackupManagerContent />
    </BackupProvider>
  );
}
