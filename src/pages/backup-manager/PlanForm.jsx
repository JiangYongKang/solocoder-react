import { useState, useEffect } from 'react';
import {
  BACKUP_TYPES,
  BACKUP_TYPE_LABELS,
  FREQUENCY_TYPES,
  FREQUENCY_LABELS,
  WEEKDAYS,
  DATA_SOURCES,
  DATA_SOURCE_LABELS,
} from './constants.js';
import { validatePlanForm, parseFrequencyConfig } from './utils.js';
import { useBackup } from './BackupContext.jsx';

export default function PlanForm({ isOpen, onClose, editingPlan }) {
  const { createPlan, updatePlan } = useBackup();

  const [formData, setFormData] = useState({
    name: '',
    backupType: BACKUP_TYPES.FULL,
    frequency: FREQUENCY_TYPES.DAILY,
    frequencyConfig: {},
    backupTime: '02:00',
    retentionCount: 7,
    dataSources: [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingPlan) {
      setFormData({
        name: editingPlan.name,
        backupType: editingPlan.backupType,
        frequency: editingPlan.frequency,
        frequencyConfig: editingPlan.frequencyConfig || {},
        backupTime: editingPlan.backupTime,
        retentionCount: editingPlan.retentionCount,
        dataSources: editingPlan.dataSources || [],
      });
    } else {
      setFormData({
        name: '',
        backupType: BACKUP_TYPES.FULL,
        frequency: FREQUENCY_TYPES.DAILY,
        frequencyConfig: {},
        backupTime: '02:00',
        retentionCount: 7,
        dataSources: [],
      });
    }
    setErrors({});
  }, [editingPlan, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      let updated = { ...prev, [field]: value };
      if (field === 'frequency') {
        if (value === FREQUENCY_TYPES.WEEKLY) {
          updated.frequencyConfig = { weekDay: 1 };
        } else if (value === FREQUENCY_TYPES.MONTHLY) {
          updated.frequencyConfig = { monthDay: 1 };
        } else {
          updated.frequencyConfig = {};
        }
      }
      return updated;
    });
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFrequencyConfigChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      frequencyConfig: {
        ...prev.frequencyConfig,
        [field]: value,
      },
    }));
  };

  const handleDataSourceToggle = (source) => {
    setFormData((prev) => {
      const sources = prev.dataSources.includes(source)
        ? prev.dataSources.filter((s) => s !== source)
        : [...prev.dataSources, source];
      return { ...prev, dataSources: sources };
    });
    if (errors.dataSources) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.dataSources;
        return next;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validation = validatePlanForm(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    const planData = {
      ...formData,
      frequencyConfig: parseFrequencyConfig(formData.frequency, formData.frequencyConfig),
    };

    let result;
    if (editingPlan) {
      result = updatePlan(editingPlan.id, planData);
    } else {
      result = createPlan(planData);
    }

    if (result.success) {
      onClose();
    } else {
      alert(result.error || '操作失败');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal backup-plan-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{editingPlan ? '编辑备份计划' : '创建备份计划'}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">
                计划名称 <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                placeholder="请输入计划名称"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                备份类型 <span className="required">*</span>
              </label>
              <div className="radio-group">
                {Object.entries(BACKUP_TYPE_LABELS).map(([value, label]) => (
                  <label key={value} className="radio-item">
                    <input
                      type="radio"
                      name="backupType"
                      value={value}
                      checked={formData.backupType === value}
                      onChange={(e) => handleChange('backupType', e.target.value)}
                    />
                    <span>{label}</span>
                    <span
                      className={`type-badge ${value === BACKUP_TYPES.FULL ? 'full-badge' : 'incremental-badge'}`}
                    >
                      {value === BACKUP_TYPES.FULL ? '完整备份' : '仅变更'}
                    </span>
                  </label>
                ))}
              </div>
              {errors.backupType && <span className="form-error">{errors.backupType}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                备份频率 <span className="required">*</span>
              </label>
              <div className="radio-group">
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <label key={value} className="radio-item">
                    <input
                      type="radio"
                      name="frequency"
                      value={value}
                      checked={formData.frequency === value}
                      onChange={(e) => handleChange('frequency', e.target.value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              {formData.frequency === FREQUENCY_TYPES.WEEKLY && (
                <div className="sub-form-group">
                  <label className="form-label">选择周几</label>
                  <select
                    className="form-select"
                    value={formData.frequencyConfig.weekDay ?? 1}
                    onChange={(e) =>
                      handleFrequencyConfigChange('weekDay', parseInt(e.target.value, 10))
                    }
                  >
                    {WEEKDAYS.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.frequency === FREQUENCY_TYPES.MONTHLY && (
                <div className="sub-form-group">
                  <label className="form-label">选择日期（1-28）</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    className="form-input"
                    value={formData.frequencyConfig.monthDay ?? 1}
                    onChange={(e) =>
                      handleFrequencyConfigChange('monthDay', parseInt(e.target.value, 10))
                    }
                  />
                </div>
              )}
              {errors.frequency && <span className="form-error">{errors.frequency}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                备份时间 <span className="required">*</span>
              </label>
              <input
                type="time"
                className={`form-input ${errors.backupTime ? 'input-error' : ''}`}
                value={formData.backupTime}
                onChange={(e) => handleChange('backupTime', e.target.value)}
              />
              {errors.backupTime && <span className="form-error">{errors.backupTime}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                保留份数 <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="30"
                className={`form-input ${errors.retentionCount ? 'input-error' : ''}`}
                value={formData.retentionCount}
                onChange={(e) => handleChange('retentionCount', parseInt(e.target.value, 10))}
              />
              <span className="form-hint">保留 1-30 份，超出后自动删除最早的备份</span>
              {errors.retentionCount && (
                <span className="form-error">{errors.retentionCount}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                备份目标 <span className="required">*</span>
              </label>
              <div className="checkbox-group">
                {Object.entries(DATA_SOURCE_LABELS).map(([value, label]) => (
                  <label key={value} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.dataSources.includes(value)}
                      onChange={() => handleDataSourceToggle(value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {errors.dataSources && <span className="form-error">{errors.dataSources}</span>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              {editingPlan ? '保存修改' : '创建计划'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
