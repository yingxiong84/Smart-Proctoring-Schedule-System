import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Teacher, Schedule, Assignment, SpecialTask, HistoricalStats, Session } from '../types';

interface AppState {
  // Data state
  teachers: Teacher[];
  schedules: Schedule[];
  sessions: Session[];
  assignments: Assignment[];
  specialTasks: SpecialTask;
  teacherExclusions: Map<string, Set<string>>;
  historicalStats: HistoricalStats;
  
  // UI state
  isLoading: boolean;
  currentStep: number;
  validationIssues: any[];
  
  // Actions
  setTeachers: (teachers: Teacher[]) => void;
  setSchedules: (schedules: Schedule[]) => void;
  setSessions: (sessions: Session[]) => void;
  setAssignments: (assignments: Assignment[]) => void;
  setSpecialTasks: (tasks: SpecialTask) => void;
  setHistoricalStats: (stats: HistoricalStats) => void;
  setCurrentStep: (step: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        teachers: [],
        schedules: [],
        sessions: [],
        assignments: [],
        specialTasks: { designated: [], forced: [] },
        teacherExclusions: new Map(),
        historicalStats: {},
        isLoading: false,
        currentStep: 1,
        validationIssues: [],
        
        // Actions
        setTeachers: (teachers) => set({ teachers, currentStep: Math.max(get().currentStep, 2) }),
        setSchedules: (schedules) => set({ schedules, currentStep: Math.max(get().currentStep, 3) }),
        setSessions: (sessions) => set({ sessions }),
        setAssignments: (assignments) => set({ assignments, currentStep: Math.max(get().currentStep, 4) }),
        setSpecialTasks: (specialTasks) => set({ specialTasks }),
        setHistoricalStats: (historicalStats) => set({ historicalStats }),
        setCurrentStep: (currentStep) => set({ currentStep }),
        setLoading: (isLoading) => set({ isLoading }),
      }),
      {
        name: 'scheduling-app-storage',
        partialize: (state) => ({
          teachers: state.teachers,
          schedules: state.schedules,
          historicalStats: state.historicalStats,
          specialTasks: state.specialTasks,
        }),
      }
    ),
    { name: 'scheduling-app' }
  )
);