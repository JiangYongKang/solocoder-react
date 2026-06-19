import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  loadPlans,
  savePlans,
  loadRecords,
  saveRecords,
  loadGlobalState,
  saveGlobalState,
  createPlan,
  updatePlan,
  deletePlan,
} from './storage.js';
import { createScheduler } from './scheduler.js';

const BackupContext = createContext(null);

export function BackupProvider({ children }) {
  const [plans, setPlans] = useState(() => loadPlans());
  const [records, setRecords] = useState(() => loadRecords());
  const [globalState, setGlobalState] = useState(() => loadGlobalState());
  const [runningTaskCount, setRunningTaskCount] = useState(0);
  const [restoring, setRestoring] = useState(false);
  const schedulerRef = useRef(null);

  const handlePlansUpdate = useCallback((updatedPlans) => {
    setPlans(updatedPlans);
    if (schedulerRef.current) {
      schedulerRef.current.setPlans(updatedPlans);
    }
  }, []);

  const handleRecordsUpdate = useCallback((updatedRecords) => {
    setRecords(updatedRecords);
    if (schedulerRef.current) {
      schedulerRef.current.setRecords(updatedRecords);
    }
  }, []);

  useEffect(() => {
    schedulerRef.current = createScheduler({
      plans,
      records,
      globalPaused: globalState.paused,
      onPlansUpdate: handlePlansUpdate,
      onRecordsUpdate: handleRecordsUpdate,
      onRunningTasksChange: setRunningTaskCount,
    });

    schedulerRef.current.start();

    return () => {
      if (schedulerRef.current) {
        schedulerRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    savePlans(plans);
  }, [plans]);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  useEffect(() => {
    saveGlobalState(globalState);
    if (schedulerRef.current) {
      schedulerRef.current.setGlobalPaused(globalState.paused);
    }
  }, [globalState]);

  const handleCreatePlan = useCallback(
    (planData) => {
      const result = createPlan(plans, planData);
      if (result.success) {
        setPlans(result.plans);
      }
      return result;
    },
    [plans]
  );

  const handleUpdatePlan = useCallback(
    (planId, updates) => {
      const result = updatePlan(plans, planId, updates);
      if (result.success) {
        setPlans(result.plans);
      }
      return result;
    },
    [plans]
  );

  const handleDeletePlan = useCallback(
    (planId) => {
      const result = deletePlan(plans, planId);
      if (result.success) {
        setPlans(result.plans);
        setRecords((prev) => prev.filter((r) => r.planId !== planId));
      }
      return result;
    },
    [plans]
  );

  const handleToggleGlobalPause = useCallback(() => {
    setGlobalState((prev) => ({ ...prev, paused: !prev.paused }));
  }, []);

  const handleTriggerManualBackup = useCallback(
    (planId) => {
      if (schedulerRef.current) {
        return schedulerRef.current.triggerManualBackup(planId);
      }
      return Promise.resolve({ success: false, error: '调度器未初始化' });
    },
    []
  );

  const handleIsTaskRunning = useCallback((planId) => {
    if (schedulerRef.current) {
      return schedulerRef.current.isTaskRunning(planId);
    }
    return false;
  }, []);

  const handleStartRestore = useCallback(() => {
    return new Promise((resolve) => {
      setRestoring(true);
      const duration = 2000 + Math.random() * 1000;
      setTimeout(() => {
        setRestoring(false);
        resolve({ success: true });
      }, duration);
    });
  }, []);

  const value = {
    plans,
    records,
    globalState,
    runningTaskCount,
    restoring,
    createPlan: handleCreatePlan,
    updatePlan: handleUpdatePlan,
    deletePlan: handleDeletePlan,
    toggleGlobalPause: handleToggleGlobalPause,
    triggerManualBackup: handleTriggerManualBackup,
    isTaskRunning: handleIsTaskRunning,
    startRestore: handleStartRestore,
  };

  return <BackupContext.Provider value={value}>{children}</BackupContext.Provider>;
}

export function useBackup() {
  const context = useContext(BackupContext);
  if (!context) {
    throw new Error('useBackup must be used within a BackupProvider');
  }
  return context;
}
