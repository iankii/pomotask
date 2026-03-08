import { create } from 'zustand';
import type { Task, List, Label, TeamTask, TeamMember, TimeEntry, TimeBlock, PomodoroSession, ActivePomodoro, AppSettings, AppState } from './types';
import localforage from 'localforage';
import LZString from 'lz-string';

// Helper to generate UUID
const generateId = () => Math.random().toString(36).substring(2, 11);

const defaultSettings: AppSettings = {
  theme: 'dark',
  pomodoroLength: 25,
  shortBreakLength: 5,
  longBreakLength: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  notificationsEnabled: false,
  pipEnabled: false,
};

const defaultLists: List[] = [
  { id: '1', title: 'To Do', color: '#3b82f6', order: 0 },
  { id: '2', title: 'In Progress', color: '#f59e0b', order: 1 },
  { id: '3', title: 'Done', color: '#10b981', order: 2 },
];

const defaultLabels: Label[] = [
  { id: generateId(), name: 'Feature', color: '#8b5cf6' },
  { id: generateId(), name: 'Bug', color: '#ef4444' },
  { id: generateId(), name: 'Documentation', color: '#06b6d4' },
  { id: generateId(), name: 'Refactor', color: '#f59e0b' },
  { id: generateId(), name: 'Testing', color: '#10b981' },
  { id: generateId(), name: 'Performance', color: '#a78bfa' },
  { id: generateId(), name: 'Security', color: '#f97316' },
];

const defaultTeamMembers: TeamMember[] = [
  { id: generateId(), name: 'Alice Johnson', avatarColor: '#3b82f6' },
  { id: generateId(), name: 'Bob Smith', avatarColor: '#8b5cf6' },
  { id: generateId(), name: 'Carol White', avatarColor: '#f59e0b' },
];

// Start with no seeded tasks for a clean deployment
const seededTasks: Task[] = [];

// No seeded team tasks on first deploy
const seededTeamTasks: TeamTask[] = [];

interface StoreState extends AppState {
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'pomodoroCount'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, listId: string) => void;
  archiveTask: (id: string) => void;
  unarchiveTask: (id: string) => void;

  // List actions
  addList: (list: Omit<List, 'id'>) => void;
  updateList: (id: string, updates: Partial<List>) => void;
  deleteList: (id: string) => void;
  reorderLists: (lists: List[]) => void;

  // Label actions
  addLabel: (label: Omit<Label, 'id'>) => void;
  updateLabel: (id: string, updates: Partial<Label>) => void;
  deleteLabel: (id: string) => void;

  // Team Member actions
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;

  // Team Task actions
  addTeamTask: (task: Omit<TeamTask, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTeamTask: (id: string, updates: Partial<TeamTask>) => void;
  deleteTeamTask: (id: string) => void;
  archiveTeamTask: (id: string) => void;
  unarchiveTeamTask: (id: string) => void;

  // Time Entry actions
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => void;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;
  addTimeBlockToEntry: (entryId: string, timeBlock: Omit<TimeBlock, 'id' | 'duration'>) => void;

  // Pomodoro actions
  addPomodoroSession: (session: PomodoroSession) => void;
  incrementTaskPomodoro: (taskId: string) => void;
  setActivePomodoro: (pomodoro: ActivePomodoro | null) => void;
  updateActivePomodoro: (updates: Partial<ActivePomodoro>) => void;
  clearActivePomodoro: () => void;
  /** Incrementing this flag tells PomodoroTimer to restart with prevDuration from activePomodoro */
  restartPomodoroFlag: number;
  triggerPomodoroRestart: () => void;

  // Settings actions
  updateSettings: (updates: Partial<AppSettings>) => void;

  // User actions
  setCurrentUser: (userId: string) => void;

  // Persistence
  setFileHandle: (handle: FileSystemFileHandle | null) => void;
  initializeStore: () => Promise<void>;
  saveToFile: () => Promise<void>;
  // Now async: persists to IndexedDB (localforage) with optional compression.
  saveToLocalStorage: () => Promise<void>;
}

let saveTimeout: ReturnType<typeof setTimeout>;

export const useStore = create<StoreState>((set, get) => {
  const debouncedSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      const state = get();
      state.saveToLocalStorage();
      state.saveToFile().catch(console.error);
    }, 1000);
  };

  return {
    // Initial state
    tasks: seededTasks,
    archivedTasks: [],
    lists: defaultLists,
    labels: defaultLabels,
    teamMembers: defaultTeamMembers,
    teamTasks: seededTeamTasks as TeamTask[],
    archivedTeamTasks: [],
    currentUserId: defaultTeamMembers[0]?.id,
    timeEntries: [],
    pomodoroSessions: [],
    activePomodoro: null,
    restartPomodoroFlag: 0,
    settings: defaultSettings,
    fileHandle: null,

    // Task actions
    addTask: (task) => {
      const newTask: Task = {
        ...task,
        id: generateId(),
        createdAt: new Date().toISOString(),
        pomodoroCount: 0,
      };
      set((state) => ({ tasks: [...state.tasks, newTask] }));
      debouncedSave();
    },

    updateTask: (id, updates) => {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
      debouncedSave();
    },

    deleteTask: (id) => {
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
      debouncedSave();
    },

    moveTask: (taskId, listId) => {
      set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id === taskId) {
            const updated = { ...t, listId };
            // Clear matrixQuadrant if not in To Do column
            if (listId !== '1') {
              delete updated.matrixQuadrant;
            }
            return updated;
          }
          return t;
        }),
      }));
      debouncedSave();
    },

    archiveTask: (id) => {
      set((state) => {
        const task = state.tasks.find((t) => t.id === id);
        if (!task) return state;
        return {
          tasks: state.tasks.filter((t) => t.id !== id),
          archivedTasks: [...state.archivedTasks, { ...task, archivedAt: new Date().toISOString() }],
        };
      });
      debouncedSave();
    },

    unarchiveTask: (id) => {
      set((state) => {
        const task = state.archivedTasks.find((t) => t.id === id);
        if (!task) return state;
        const { archivedAt, ...taskWithoutArchivedAt } = task;
        return {
          archivedTasks: state.archivedTasks.filter((t) => t.id !== id),
          tasks: [...state.tasks, taskWithoutArchivedAt],
        };
      });
      debouncedSave();
    },

    // List actions
    addList: (list) => {
      set((state) => ({
        lists: [...state.lists, { ...list, id: generateId() }],
      }));
      debouncedSave();
    },

    updateList: (id, updates) => {
      set((state) => ({
        lists: state.lists.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      }));
      debouncedSave();
    },

    deleteList: (id) => {
      set((state) => ({
        lists: state.lists.filter((l) => l.id !== id),
        tasks: state.tasks.filter((t) => t.listId !== id),
      }));
      debouncedSave();
    },

    reorderLists: (lists) => {
      set({ lists });
      debouncedSave();
    },

    // Label actions
    addLabel: (label) => {
      set((state) => ({
        labels: [...state.labels, { ...label, id: generateId() }],
      }));
      debouncedSave();
    },

    updateLabel: (id, updates) => {
      set((state) => ({
        labels: state.labels.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      }));
      debouncedSave();
    },

    deleteLabel: (id) => {
      set((state) => ({
        labels: state.labels.filter((l) => l.id !== id),
        tasks: state.tasks.map((t) => ({
          ...t,
          labels: t.labels.filter((lId) => lId !== id),
        })),
      }));
      debouncedSave();
    },

    // Team Member actions
    addTeamMember: (member) => {
      set((state) => ({
        teamMembers: [...state.teamMembers, { ...member, id: generateId() }],
      }));
      debouncedSave();
    },

    updateTeamMember: (id, updates) => {
      set((state) => ({
        teamMembers: state.teamMembers.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      }));
      debouncedSave();
    },

    deleteTeamMember: (id) => {
      set((state) => ({
        teamMembers: state.teamMembers.filter((m) => m.id !== id),
        teamTasks: state.teamTasks.filter((t) => t.assignedTo !== id),
      }));
      debouncedSave();
    },

    // Team Task actions
    addTeamTask: (task) => {
      const newTask: TeamTask = {
        ...task,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => ({ teamTasks: [...state.teamTasks, newTask] }));
      debouncedSave();
    },

    updateTeamTask: (id, updates) => {
      set((state) => ({
        teamTasks: state.teamTasks.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        ),
      }));
      debouncedSave();
    },

    deleteTeamTask: (id) => {
      set((state) => ({
        teamTasks: state.teamTasks.filter((t) => t.id !== id),
      }));
      debouncedSave();
    },

    archiveTeamTask: (id) => {
      set((state) => {
        const task = state.teamTasks.find((t) => t.id === id);
        if (!task) return state;
        return {
          teamTasks: state.teamTasks.filter((t) => t.id !== id),
          archivedTeamTasks: [...state.archivedTeamTasks, task],
        };
      });
      debouncedSave();
    },

    unarchiveTeamTask: (id) => {
      set((state) => {
        const task = state.archivedTeamTasks.find((t) => t.id === id);
        if (!task) return state;
        return {
          archivedTeamTasks: state.archivedTeamTasks.filter((t) => t.id !== id),
          teamTasks: [...state.teamTasks, task],
        };
      });
      debouncedSave();
    },

    // Time Entry actions
    addTimeEntry: (entry) => {
      const newEntry: TimeEntry = {
        ...entry,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ timeEntries: [...state.timeEntries, newEntry] }));
      debouncedSave();
    },

    updateTimeEntry: (id, updates) => {
      set((state) => ({
        timeEntries: state.timeEntries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      }));
      debouncedSave();
    },

    deleteTimeEntry: (id) => {
      set((state) => ({
        timeEntries: state.timeEntries.filter((e) => e.id !== id),
      }));
      debouncedSave();
    },

    addTimeBlockToEntry: (entryId, timeBlock) => {
      set((state) => ({
        timeEntries: state.timeEntries.map((e) => {
          if (e.id === entryId) {
            const duration = calculateDuration(timeBlock.startTime, timeBlock.endTime);
            const newBlock: TimeBlock = {
              ...timeBlock,
              id: generateId(),
              duration,
            };
            return {
              ...e,
              timeBlocks: [...e.timeBlocks, newBlock],
              duration: e.duration + duration,
            };
          }
          return e;
        }),
      }));
      debouncedSave();
    },

    // Pomodoro actions
    addPomodoroSession: (session) => {
      set((state) => ({
        pomodoroSessions: [...state.pomodoroSessions, session],
      }));
      debouncedSave();
    },

    incrementTaskPomodoro: (taskId) => {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, pomodoroCount: t.pomodoroCount + 1 } : t
        ),
      }));
      debouncedSave();
    },

    setActivePomodoro: (pomodoro) => {
      set(() => ({ activePomodoro: pomodoro }));
    },

    updateActivePomodoro: (updates) => {
      set((state) => ({
        activePomodoro: state.activePomodoro
          ? { ...state.activePomodoro, ...updates }
          : null,
      }));
    },

    clearActivePomodoro: () => {
      set(() => ({ activePomodoro: null }));
    },
    triggerPomodoroRestart: () => {
      set((state) => ({ restartPomodoroFlag: state.restartPomodoroFlag + 1 }));
    },

    // Settings actions
    updateSettings: (updates) => {
      set((state) => ({
        settings: { ...state.settings, ...updates },
      }));
      debouncedSave();
    },

    // User actions
    setCurrentUser: (userId) => {
      set({ currentUserId: userId });
      debouncedSave();
    },

    // Persistence
    setFileHandle: (handle) => {
      set({ fileHandle: handle });
    },

    saveToLocalStorage: async () => {
      const state = get();

      // Minimal, normalized payload to keep size down
      const payload = {
        version: 2,
        lastSavedAt: new Date().toISOString(),
        tasks: state.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          listId: t.listId,
          priority: t.priority,
          matrixQuadrant: t.matrixQuadrant,
          labels: t.labels,
          dueDate: t.dueDate,
          sprint: t.sprint,
          completed: t.completed,
          pomodoroCount: t.pomodoroCount,
          estimatedPomodoros: t.estimatedPomodoros,
          assignedTo: t.assignedTo,
          needsMyInput: t.needsMyInput,
        })),
        archivedTasks: state.archivedTasks.map((t) => ({
          id: t.id,
          title: t.title,
          listId: t.listId,
          archivedAt: t.archivedAt,
        })),
        lists: state.lists,
        labels: state.labels,
        teamMembers: state.teamMembers,
        teamTasks: state.teamTasks.map((tt) => ({
          id: tt.id,
          title: tt.title,
          status: tt.status,
          assignedTo: tt.assignedTo,
          needsMyAttention: tt.needsMyAttention,
          createdAt: tt.createdAt,
          updatedAt: tt.updatedAt,
        })),
        archivedTeamTasks: state.archivedTeamTasks,
        timeEntries: state.timeEntries,
        pomodoroSessions: state.pomodoroSessions,
        settings: state.settings,
      };

      try {
        // Compress payload to reduce storage size
        const compressed = LZString.compressToUTF16(JSON.stringify(payload));
        await localforage.setItem('kanban-app-data', compressed);
      } catch (err) {
        // Fallback to localStorage if IndexedDB fails
        try {
          localStorage.setItem('kanban-app-data', JSON.stringify(payload));
        } catch (e) {
          console.error('Failed to persist data:', e);
        }
      }
    },

    saveToFile: async () => {
      const state = get();
      if (!state.fileHandle) return;

      try {
        const writable = await state.fileHandle.createWritable();
        const dataToSave = {
          tasks: state.tasks,
          archivedTasks: state.archivedTasks,
          lists: state.lists,
          labels: state.labels,
          teamMembers: state.teamMembers,
          teamTasks: state.teamTasks,
          archivedTeamTasks: state.archivedTeamTasks,
          timeEntries: state.timeEntries,
          pomodoroSessions: state.pomodoroSessions,
          settings: state.settings,
        };
        await writable.write(JSON.stringify(dataToSave, null, 2));
        await writable.close();
      } catch (error) {
        console.error('Failed to save to file:', error);
      }
    },

    initializeStore: async () => {
      try {
        // Try to load from localForage (IndexedDB) first
        const raw = await localforage.getItem<string>('kanban-app-data');
        let parsed: any = null;

        if (raw) {
          try {
            const decompressed = LZString.decompressFromUTF16(raw) || raw;
            parsed = typeof decompressed === 'string' ? JSON.parse(decompressed) : decompressed;
          } catch (e) {
            // If it wasn't compressed, try parsing raw
            try {
              parsed = JSON.parse(raw as any);
            } catch (err) {
              console.error('Failed to parse persisted data from localforage:', err);
            }
          }
        } else {
          // Fallback to localStorage for older installs
          const savedData = localStorage.getItem('kanban-app-data');
          if (savedData) {
            parsed = JSON.parse(savedData);
          }
        }

        if (parsed) {
          // Sanitize tasks: ensure tasks in Done (list '3') are marked completed,
          // and tasks not in Done are not marked completed to keep UI consistent.
          const rawTasks = parsed.tasks || [];
          const sanitizedTasks = rawTasks.map((t: any) => ({
            ...t,
            completed: t.listId === '3' ? true : false,
          }));

          set({
            tasks: sanitizedTasks,
            archivedTasks: parsed.archivedTasks || [],
            lists: parsed.lists || defaultLists,
            labels: parsed.labels || defaultLabels,
            teamMembers: parsed.teamMembers || defaultTeamMembers,
            teamTasks: parsed.teamTasks || [],
            archivedTeamTasks: parsed.archivedTeamTasks || [],
            timeEntries: parsed.timeEntries || [],
            pomodoroSessions: parsed.pomodoroSessions || [],
            settings: { ...defaultSettings, ...parsed.settings },
            // Never restore a running timer — always start fresh on page load
            activePomodoro: null,
            restartPomodoroFlag: 0,
          });
        }
      } catch (error) {
        console.error('Failed to initialize store:', error);
      }
    },
  };
});

function calculateDuration(start: string, end: string): number {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes - startMinutes;
}
