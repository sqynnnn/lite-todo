
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskType = 'task' | 'routine';

export interface UserProfile {
  name: string;
  status: string;
}

export interface TaskLog {
  id: string;
  step: string;
  timestamp: string;
  duration: number;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  type: TaskType;
  deadline?: string; // YYYY-MM-DD
  completedAt?: string;
  logs: TaskLog[];
  // Routine Stats
  currentStreak?: number;
  longestStreak?: number;
  lastCompletedDate?: string;
}

export interface DayLog {
  date: string;
  mood: string;
  reflection: string;
  completedCount: number;
  completedTaskTitles: string[]; 
}

export interface SavedReport {
  id: string;
  generatedDate: string;
  dateRange: { start: string; end: string };
  stats: {
    totalTasks: number;
    avgMood: string;
    routineConsistency: { title: string; percent: number; count: number }[];
  };
  notes: string; // User or AI analysis
}

export interface Memo {
  id: string;
  content: string;
  updatedAt: string;
}

export interface PageItem {
  id: string;
  type: 'file' | 'folder'; 
  parentId: string | null; 
  title: string;
  subtitle: string;
  content?: string; 
  tags?: string[];
  updatedAt: string;
}
