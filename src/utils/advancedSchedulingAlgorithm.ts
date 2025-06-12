import { Teacher, Schedule, Assignment, SpecialTask, HistoricalStats } from '../types';

interface SchedulingParams {
  teachers: Teacher[];
  schedules: Schedule[];
  specialTasks: SpecialTask;
  teacherExclusions: Map<string, Set<string>>;
  historicalStats: HistoricalStats;
  preferences?: SchedulingPreferences;
}

interface SchedulingPreferences {
  balanceWorkload: boolean;
  minimizeConsecutive: boolean;
  respectDepartments: boolean;
  prioritizeExperience: boolean;
  maxConsecutiveHours: number;
  maxDailyHours: number;
}

interface TeacherScore {
  teacher: Teacher;
  score: number;
  reasons: string[];
}

export const generateAdvancedAssignments = async (params: SchedulingParams): Promise<Assignment[]> => {
  const { teachers, schedules, specialTasks, teacherExclusions, historicalStats, preferences } = params;
  
  // Initialize advanced scoring system
  const teacherScores = initializeTeacherScores(teachers, historicalStats, preferences);
  const assignments: Assignment[] = [];
  
  // Phase 1: Handle mandatory assignments (forced and designated)
  await handleMandatoryAssignments(assignments, specialTasks, schedules, teacherScores);
  
  // Phase 2: Intelligent assignment using multi-criteria optimization
  await optimizeAssignments(assignments, schedules, teacherScores, teacherExclusions, preferences);
  
  // Phase 3: Post-processing optimization
  await postProcessOptimization(assignments, teacherScores, preferences);
  
  return assignments.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.startTime}`);
    const dateB = new Date(`${b.date} ${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });
};

function initializeTeacherScores(
  teachers: Teacher[], 
  historicalStats: HistoricalStats,
  preferences?: SchedulingPreferences
): Map<string, TeacherScore> {
  const scores = new Map<string, TeacherScore>();
  
  teachers.forEach(teacher => {
    const historical = historicalStats[teacher.name] || { count: 0, duration: 0 };
    let baseScore = 100;
    const reasons: string[] = [];
    
    // Workload balancing
    if (preferences?.balanceWorkload) {
      const avgWorkload = Object.values(historicalStats).reduce((sum, stat) => sum + stat.duration, 0) / teachers.length;
      if (historical.duration < avgWorkload) {
        baseScore += 20;
        reasons.push('工作量较少');
      } else if (historical.duration > avgWorkload * 1.5) {
        baseScore -= 15;
        reasons.push('工作量较重');
      }
    }
    
    // Experience factor
    if (preferences?.prioritizeExperience && historical.count > 10) {
      baseScore += 10;
      reasons.push('经验丰富');
    }
    
    scores.set(teacher.name, {
      teacher,
      score: baseScore,
      reasons
    });
  });
  
  return scores;
}

async function handleMandatoryAssignments(
  assignments: Assignment[],
  specialTasks: SpecialTask,
  schedules: Schedule[],
  teacherScores: Map<string, TeacherScore>
): Promise<void> {
  // Handle forced assignments first
  for (const task of specialTasks.forced) {
    const schedule = schedules.find(s => 
      s.id.includes(task.sessionId) && s.location === task.location
    );
    
    if (schedule) {
      assignments.push({
        ...schedule,
        teacher: task.teacher,
        assignedBy: 'forced'
      });
      
      // Update teacher score
      const teacherScore = teacherScores.get(task.teacher);
      if (teacherScore) {
        teacherScore.score -= 5; // Slight penalty for forced assignment
      }
    }
  }
  
  // Handle designated assignments
  for (const task of specialTasks.designated) {
    const schedule = schedules.find(s => 
      s.id.includes(task.slotId) && s.location === task.location
    );
    
    if (schedule) {
      assignments.push({
        ...schedule,
        teacher: task.teacher,
        assignedBy: 'designated'
      });
      
      // Update teacher score
      const teacherScore = teacherScores.get(task.teacher);
      if (teacherScore) {
        teacherScore.score += 5; // Small bonus for designated assignment
      }
    }
  }
}

async function optimizeAssignments(
  assignments: Assignment[],
  schedules: Schedule[],
  teacherScores: Map<string, TeacherScore>,
  teacherExclusions: Map<string, Set<string>>,
  preferences?: SchedulingPreferences
): Promise<void> {
  const remainingSlots = getRemainingSlots(schedules, assignments);
  
  // Sort slots by priority (earlier dates first, then by difficulty)
  remainingSlots.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.startTime}`);
    const dateB = new Date(`${b.date} ${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });
  
  for (const slot of remainingSlots) {
    const eligibleTeachers = getEligibleTeachersAdvanced(
      Array.from(teacherScores.values()).map(ts => ts.teacher),
      slot,
      assignments,
      teacherExclusions,
      preferences
    );
    
    if (eligibleTeachers.length > 0) {
      // Score each eligible teacher for this specific slot
      const scoredTeachers = eligibleTeachers.map(teacher => {
        const baseScore = teacherScores.get(teacher.name)?.score || 0;
        const slotSpecificScore = calculateSlotSpecificScore(teacher, slot, assignments, preferences);
        
        return {
          teacher,
          totalScore: baseScore + slotSpecificScore,
          breakdown: {
            base: baseScore,
            slotSpecific: slotSpecificScore
          }
        };
      });
      
      // Select best teacher
      scoredTeachers.sort((a, b) => b.totalScore - a.totalScore);
      const selectedTeacher = scoredTeachers[0].teacher;
      
      assignments.push({
        ...slot,
        teacher: selectedTeacher.name,
        assignedBy: 'auto'
      });
      
      // Update teacher score for future assignments
      const teacherScore = teacherScores.get(selectedTeacher.name);
      if (teacherScore) {
        teacherScore.score -= 10; // Reduce score to balance workload
      }
    } else {
      // No eligible teacher found
      assignments.push({
        ...slot,
        teacher: '!!无法分配!!',
        assignedBy: 'auto'
      });
    }
  }
}

function calculateSlotSpecificScore(
  teacher: Teacher,
  slot: Schedule,
  assignments: Assignment[],
  preferences?: SchedulingPreferences
): number {
  let score = 0;
  
  // Check for consecutive assignments
  if (preferences?.minimizeConsecutive) {
    const teacherAssignments = assignments.filter(a => a.teacher === teacher.name);
    const hasConsecutive = teacherAssignments.some(a => {
      if (a.date === slot.date) {
        const aEnd = new Date(`${a.date} ${a.endTime}`);
        const slotStart = new Date(`${slot.date} ${slot.startTime}`);
        const timeDiff = Math.abs(aEnd.getTime() - slotStart.getTime()) / (1000 * 60); // minutes
        return timeDiff <= 30; // Within 30 minutes
      }
      return false;
    });
    
    if (hasConsecutive) {
      score -= 20;
    }
  }
  
  // Department matching bonus
  if (preferences?.respectDepartments && teacher.department) {
    // Could add logic to prefer certain departments for certain types of exams
    score += 5;
  }
  
  // Time preference (morning vs afternoon)
  const hour = parseInt(slot.startTime.split(':')[0]);
  if (hour >= 8 && hour <= 10) {
    score += 5; // Morning preference
  }
  
  return score;
}

function getEligibleTeachersAdvanced(
  teachers: Teacher[],
  slot: Schedule,
  assignments: Assignment[],
  teacherExclusions: Map<string, Set<string>>,
  preferences?: SchedulingPreferences
): Teacher[] {
  return teachers.filter(teacher => {
    // Basic eligibility checks
    const hasTimeConflict = assignments.some(a => 
      a.teacher === teacher.name &&
      a.date === slot.date &&
      !(a.endTime <= slot.startTime || a.startTime >= slot.endTime)
    );
    
    if (hasTimeConflict) return false;
    
    // Check exclusions
    const exclusions = teacherExclusions.get(teacher.name);
    if (exclusions) {
      const sessionId = `${slot.date}_${slot.startTime}_${slot.endTime}`;
      if (exclusions.has(`${sessionId}_all`) || exclusions.has(`${sessionId}_${slot.location}`)) {
        return false;
      }
    }
    
    // Advanced checks based on preferences
    if (preferences?.maxDailyHours) {
      const dailyHours = calculateDailyHours(teacher, slot.date, assignments);
      const slotDuration = calculateDuration(slot.startTime, slot.endTime) / 60; // hours
      
      if (dailyHours + slotDuration > preferences.maxDailyHours) {
        return false;
      }
    }
    
    return true;
  });
}

function calculateDailyHours(teacher: Teacher, date: string, assignments: Assignment[]): number {
  const dailyAssignments = assignments.filter(a => 
    a.teacher === teacher.name && a.date === date
  );
  
  return dailyAssignments.reduce((total, assignment) => {
    const duration = calculateDuration(assignment.startTime, assignment.endTime) / 60; // hours
    return total + duration;
  }, 0);
}

function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);
  return (end.getTime() - start.getTime()) / 60000; // minutes
}

async function postProcessOptimization(
  assignments: Assignment[],
  teacherScores: Map<string, TeacherScore>,
  preferences?: SchedulingPreferences
): Promise<void> {
  // Implement post-processing optimizations like:
  // - Swapping assignments to better balance workload
  // - Reducing consecutive assignments
  // - Optimizing travel time between locations
  
  if (preferences?.balanceWorkload) {
    await balanceWorkloadOptimization(assignments, teacherScores);
  }
}

async function balanceWorkloadOptimization(
  assignments: Assignment[],
  teacherScores: Map<string, TeacherScore>
): Promise<void> {
  // Calculate current workload distribution
  const workloadMap = new Map<string, number>();
  
  assignments.forEach(assignment => {
    if (!assignment.teacher.startsWith('!!')) {
      const current = workloadMap.get(assignment.teacher) || 0;
      const duration = calculateDuration(assignment.startTime, assignment.endTime);
      workloadMap.set(assignment.teacher, current + duration);
    }
  });
  
  // Find opportunities for beneficial swaps
  const workloads = Array.from(workloadMap.entries());
  workloads.sort((a, b) => b[1] - a[1]); // Sort by workload descending
  
  // Implementation of swap logic would go here
  // This is a simplified version - real implementation would be more sophisticated
}

function getRemainingSlots(schedules: Schedule[], assignments: Assignment[]): Schedule[] {
  const remainingSlots: Schedule[] = [];
  
  for (const schedule of schedules) {
    const assignedCount = assignments.filter(a => 
      a.id === schedule.id && !a.teacher.startsWith('!!')
    ).length;
    
    const remaining = schedule.required - assignedCount;
    
    for (let i = 0; i < remaining; i++) {
      remainingSlots.push({
        ...schedule,
        id: `${schedule.id}_auto_${i}`
      });
    }
  }
  
  return remainingSlots;
}