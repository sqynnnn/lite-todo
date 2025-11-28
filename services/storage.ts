
import { Task, Memo, DayLog, PageItem, UserProfile, SavedReport } from '../types';

const KEYS = {
  PROFILE: 'gh_profile_v1',
  TASKS: 'gh_tasks_v3',
  MEMOS: 'gh_memos_v1',
  DAY_LOGS: 'gh_daylogs_v2',
  DAY_STATUS: 'gh_day_active_v1',
  SAVED_REPORTS: 'gh_reports_v1',
  // Modular Pages Keys
  SELF_OBS_PAGES: 'gh_self_obs_pages_v1',
  LEARNING_KNOWLEDGE: 'gh_learning_knowledge_v1',
  LEARNING_SKILLS: 'gh_learning_skills_v1',
};

export const StorageService = {
  // --- Profile ---
  getProfile: (): UserProfile => {
    try {
      const data = localStorage.getItem(KEYS.PROFILE);
      return data ? JSON.parse(data) : { name: 'Operator', status: 'Ready for input.' };
    } catch { return { name: 'Operator', status: 'Ready for input.' }; }
  },

  saveProfile: (profile: UserProfile) => {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  // --- Tasks ---
  getTasks: (): Task[] => {
    try {
      const data = localStorage.getItem(KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveTasks: (tasks: Task[]) => {
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  },

  // --- Memos ---
  getMemos: (): Memo[] => {
    try {
      const data = localStorage.getItem(KEYS.MEMOS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveMemos: (memos: Memo[]) => {
    localStorage.setItem(KEYS.MEMOS, JSON.stringify(memos));
  },

  // --- Day Logs ---
  getDayLogs: (): DayLog[] => {
    try {
      const data = localStorage.getItem(KEYS.DAY_LOGS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveDayLog: (log: DayLog) => {
    const logs = StorageService.getDayLogs();
    const existingIndex = logs.findIndex(l => l.date === log.date);
    if (existingIndex >= 0) {
      logs[existingIndex] = log;
    } else {
      logs.unshift(log);
    }
    localStorage.setItem(KEYS.DAY_LOGS, JSON.stringify(logs));
  },

  // --- Saved Reports ---
  getReports: (): SavedReport[] => {
    try {
      const data = localStorage.getItem(KEYS.SAVED_REPORTS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveReports: (reports: SavedReport[]) => {
    localStorage.setItem(KEYS.SAVED_REPORTS, JSON.stringify(reports));
  },

  // --- Day Status ---
  isDayActive: (): boolean => {
    return localStorage.getItem(KEYS.DAY_STATUS) === 'active';
  },

  setDayActive: (active: boolean) => {
    localStorage.setItem(KEYS.DAY_STATUS, active ? 'active' : 'inactive');
  },

  // --- Modular Pages (Generic) ---
  getPages: (key: string): PageItem[] => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      // Migration: Ensure all items have a type and parentId
      return parsed.map((item: any) => ({
        ...item,
        type: item.type || 'file',
        parentId: item.parentId || null
      }));
    } catch { return []; }
  },

  savePages: (key: string, pages: PageItem[]) => {
    localStorage.setItem(key, JSON.stringify(pages));
  },

  // --- Generic Lists ---
  getListItems: (key: string): any[] => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveListItems: (key: string, items: any[]) => {
    localStorage.setItem(key, JSON.stringify(items));
  },

  // --- Data Sync (Full Export/Import) ---
  exportData: () => {
    const data: any = {};
    Object.values(KEYS).forEach(key => {
      data[key] = localStorage.getItem(key);
    });
    return JSON.stringify(data);
  },

  importData: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      Object.keys(data).forEach(key => {
        if (data[key]) localStorage.setItem(key, data[key]);
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  
  KEYS
};
