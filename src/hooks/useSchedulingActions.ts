import { useCallback } from 'react';
import { useAppStore } from '../store';
import { generateOptimalAssignments } from '../utils/schedulingAlgorithm';
import { validateSchedulingData } from '../utils/validation';
import { detectConflicts } from '../utils/conflictDetection';

export const useSchedulingActions = () => {
  const {
    teachers,
    schedules,
    sessions,
    specialTasks,
    teacherExclusions,
    historicalStats,
    setAssignments,
    setLoading,
  } = useAppStore();

  const generateAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const issues = validateSchedulingData(teachers, schedules, specialTasks, teacherExclusions);
      
      if (issues.some(issue => issue.type === 'error')) {
        throw new Error('存在阻止生成的错误，请先修复');
      }

      const newAssignments = await generateOptimalAssignments({
        teachers,
        schedules,
        sessions,
        specialTasks,
        teacherExclusions,
        historicalStats
      });

      setAssignments(newAssignments);
      return newAssignments;
    } catch (error) {
      console.error('生成排班失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [teachers, schedules, sessions, specialTasks, teacherExclusions, historicalStats, setAssignments, setLoading]);

  const getConflicts = useCallback(() => {
    const assignments = useAppStore.getState().assignments;
    return detectConflicts(assignments, teachers, teacherExclusions);
  }, [teachers, teacherExclusions]);

  return {
    generateAssignments,
    getConflicts,
  };
};